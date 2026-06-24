import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { magnetometer, accelerometer, SensorTypes, setUpdateIntervalForType } from 'react-native-sensors';
import colors from '../../../../theme/colors';
import { hapticSuccess } from '../../../../utils/haptics';

// Native compass heading. On iOS this uses CoreLocation's trueHeading (already
// true-north, the correct & calibrated iOS approach). On Android it uses the
// fused rotation-vector sensor (magnetic north -> we add declination). Guarded
// so the screen still works (falling back to the raw magnetometer) if the
// native module isn't linked.
let CompassHeading = null;
try {
  // eslint-disable-next-line global-require
  const mod = require('react-native-compass-heading');
  CompassHeading = mod?.default || mod || null;
} catch (e) {
  CompassHeading = null;
}

// The Kaaba (Masjid al-Haram, Makkah).
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;
const EARTH_RADIUS_KM = 6371;

// Pure-JS World Magnetic Model — converts a magnetic-north heading to TRUE north
// (the declination varies by location, so this is what makes the Qibla accurate
// anywhere in the world). Guarded so a load failure can never crash the screen.
let geomagnetism = null;
try {
  // eslint-disable-next-line global-require
  geomagnetism = require('geomagnetism');
} catch (e) {
  geomagnetism = null;
}

const toRad = deg => (deg * Math.PI) / 180;
const toDeg = rad => (rad * 180) / Math.PI;

// Great-circle initial bearing from the user to the Kaaba (degrees from North).
function computeQiblaBearing(latitude, longitude) {
  const userLat = toRad(latitude);
  const kaabaLat = toRad(KAABA_LAT);
  const dLng = toRad(KAABA_LNG - longitude);

  const y = Math.sin(dLng);
  const x =
    Math.cos(userLat) * Math.tan(kaabaLat) -
    Math.sin(userLat) * Math.cos(dLng);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Great-circle distance to the Kaaba in km.
function computeDistanceKm(latitude, longitude) {
  const dLat = toRad(KAABA_LAT - latitude);
  const dLng = toRad(KAABA_LNG - longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(latitude)) * Math.cos(toRad(KAABA_LAT)) * Math.sin(dLng / 2) ** 2;
  return Math.round(EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Magnetic declination (degrees, east positive) at a location.
function getDeclination(latitude, longitude) {
  if (!geomagnetism) return 0;
  try {
    const model = geomagnetism.model(new Date(), { allowOutOfBoundsModel: true });
    const info = model.point([latitude, longitude]);
    return Number.isFinite(info?.decl) ? info.decl : 0;
  } catch (e) {
    return 0;
  }
}

// Tilt-compensated compass heading (degrees from MAGNETIC north) from the raw
// magnetometer + accelerometer vectors. Works at any phone tilt.
function computeTiltCompensatedHeading(mag, acc) {
  const mx = mag.x, my = mag.y, mz = mag.z;
  let gx = acc.x, gy = acc.y, gz = acc.z;

  const normG = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
  gx /= normG; gy /= normG; gz /= normG;

  let ex = my * gz - mz * gy;
  let ey = mz * gx - mx * gz;
  let ez = mx * gy - my * gx;
  const normE = Math.sqrt(ex * ex + ey * ey + ez * ez) || 1;
  ex /= normE; ey /= normE; ez /= normE;

  const ny = gz * ex - gx * ez;

  let heading = Math.atan2(ey, ny) * (180 / Math.PI);
  return (heading + 360) % 360;
}

function computeFlatHeading(mag) {
  let heading = Math.atan2(mag.y, mag.x) * (180 / Math.PI);
  return (heading + 360) % 360;
}

// Low-pass filter on a circular (0-360) signal so it wraps correctly.
function smoothAngle(prev, next, alpha) {
  if (prev == null) return next;
  const pr = (prev * Math.PI) / 180;
  const nx = (next * Math.PI) / 180;
  const sin = (1 - alpha) * Math.sin(pr) + alpha * Math.sin(nx);
  const cos = (1 - alpha) * Math.cos(pr) + alpha * Math.cos(nx);
  return (Math.atan2(sin, cos) * (180 / Math.PI) + 360) % 360;
}

const RING = 264;
const BLUE = '#2E6FB0';
const GREEN = '#16A36B';

export default function QiblaPanel({ latitude, longitude }) {
  // `heading` state is updated at a throttled rate just for the on-screen
  // numbers + alignment logic. The actual needle rotation is driven by the
  // Animated values below (on the native UI thread) for smooth, lag-free motion.
  const [heading, setHeading] = useState(0);
  const [compassReady, setCompassReady] = useState(false);

  const accelRef = useRef({ x: 0, y: 0, z: 9.81 });
  const hasAccelRef = useRef(false);

  // Native-thread rotation: a CONTINUOUS (unwrapped) heading so the needle
  // always takes the shortest path and never spins the long way at 360->0.
  const headingAnim = useRef(new Animated.Value(0)).current;
  const qiblaAnim = useRef(new Animated.Value(0)).current;
  const continuousRef = useRef(0);
  const lastStateRef = useRef(0);

  // Animations: a gentle idle pulse + an "expand & glow" when aligned.
  const pulse = useRef(new Animated.Value(0)).current;
  const alignProg = useRef(new Animated.Value(0)).current;
  const wasAligned = useRef(false);

  const qiblaBearing = useMemo(
    () => computeQiblaBearing(latitude, longitude),
    [latitude, longitude],
  );
  const distanceKm = useMemo(
    () => computeDistanceKm(latitude, longitude),
    [latitude, longitude],
  );
  const declination = useMemo(
    () => getDeclination(latitude, longitude),
    [latitude, longitude],
  );

  useEffect(() => {
    // Feed a fresh true-north heading: accumulate the SHORTEST delta into a
    // continuous value and animate the needle toward it on the native thread.
    const applyHeading = trueHeading => {
      const current = continuousRef.current;
      const currentMod = ((current % 360) + 360) % 360;
      let delta = trueHeading - currentMod;
      if (delta > 180) delta -= 360;
      else if (delta < -180) delta += 360;
      const next = current + delta;
      continuousRef.current = next;

      // Short timing so the rotation tracks the device in real time but still
      // interpolates smoothly between sensor samples (no stutter/jumps).
      Animated.timing(headingAnim, {
        toValue: next,
        duration: 90,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();

      // Throttle the React state (used only for the numbers + alignment colour).
      const now = Date.now();
      if (now - lastStateRef.current > 100) {
        lastStateRef.current = now;
        setHeading(((next % 360) + 360) % 360);
        setCompassReady(true);
      }
    };

    // Preferred: native compass heading (iOS CoreLocation trueHeading / Android
    // rotation-vector) — far more reliable & smooth than a raw magnetometer.
    if (CompassHeading && typeof CompassHeading.start === 'function') {
      let started = false;
      try {
        // 1° update rate = highly responsive.
        CompassHeading.start(1, data => {
          const raw = typeof data === 'number' ? data : data?.heading ?? 0;
          const trueHeading =
            Platform.OS === 'ios' ? raw : (raw + declination + 360) % 360;
          applyHeading(trueHeading);
        });
        started = true;
      } catch (e) {
        started = false;
      }

      if (started) {
        return () => {
          try {
            if (typeof CompassHeading.stop === 'function') CompassHeading.stop();
          } catch (e) {
            // ignore
          }
        };
      }
    }

    // Fallback: tilt-compensated heading from the raw magnetometer + accelerometer.
    setUpdateIntervalForType(SensorTypes.accelerometer, 60);
    setUpdateIntervalForType(SensorTypes.magnetometer, 60);

    let magSub = null;
    let accSub = null;

    try {
      accSub = accelerometer.subscribe(({ x, y, z }) => {
        accelRef.current = { x, y, z };
        hasAccelRef.current = true;
      });
    } catch (e) {
      hasAccelRef.current = false;
    }

    try {
      magSub = magnetometer.subscribe(({ x, y, z }) => {
        const magneticHeading = hasAccelRef.current
          ? computeTiltCompensatedHeading({ x, y, z }, accelRef.current)
          : computeFlatHeading({ x, y, z });
        applyHeading((magneticHeading + declination + 360) % 360);
      });
    } catch (error) {
      console.log('Magnetometer error:', error);
      setCompassReady(false);
    }

    return () => {
      if (magSub) magSub.unsubscribe();
      if (accSub) accSub.unsubscribe();
    };
  }, [declination, headingAnim]);

  // Keep the animated Qibla bearing in sync with the user's location.
  useEffect(() => {
    qiblaAnim.setValue(qiblaBearing);
  }, [qiblaBearing, qiblaAnim]);

  // Idle pulse loop.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const relativeQibla = (qiblaBearing - heading + 360) % 360;
  const isAligned = compassReady && (relativeQibla <= 4 || relativeQibla >= 356);

  // Vibrate + expand/glow exactly when alignment is first achieved.
  useEffect(() => {
    Animated.spring(alignProg, {
      toValue: isAligned ? 1 : 0,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();

    if (isAligned && !wasAligned.current) {
      hapticSuccess();
    }
    wasAligned.current = isAligned;
  }, [isAligned, alignProg]);

  const needleColor = isAligned ? GREEN : BLUE;

  // Smooth, native-thread rotations from the continuous heading.
  const dialRotateAnim = Animated.multiply(headingAnim, -1).interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });
  // Needle / Kaaba marker point at the Qibla: (qiblaBearing - heading).
  const pointerRotateAnim = Animated.subtract(qiblaAnim, headingAnim).interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  // Needle scale = base pulse (1 -> 1.04) plus an "expand" of +0.16 when aligned.
  const needleScale = Animated.add(
    pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }),
    alignProg.interpolate({ inputRange: [0, 1], outputRange: [0, 0.16] }),
  );
  const glowOpacity = alignProg.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const glowScale = alignProg.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Qibla Direction</Text>
        <View style={[styles.statusPill, isAligned && styles.statusPillAligned]}>
          {isAligned ? <Feather name="check" size={12} color={GREEN} /> : null}
          <Text style={[styles.statusText, isAligned && styles.statusTextAligned]}>
            {isAligned ? 'Facing Qibla' : `${Math.round(qiblaBearing)}° from N`}
          </Text>
        </View>
      </View>

      <View style={[styles.compassCard, isAligned && styles.compassCardAligned]}>
        <View style={styles.dialOuter}>
          <View style={styles.dialMid} />
          <View style={styles.dialInner} />

          {/* Tick marks */}
          {Array.from({ length: 24 }).map((_, i) => (
            <View
              key={`tick-${i}`}
              style={[
                styles.tickWrap,
                { transform: [{ rotate: `${i * 15}deg` }] },
              ]}
              pointerEvents="none"
            >
              <View style={[styles.tick, i % 6 === 0 && styles.tickMajor]} />
            </View>
          ))}

          {/* Green alignment glow */}
          <Animated.View
            pointerEvents="none"
            style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}
          />

          {/* Rotating cardinal ring */}
          <Animated.View style={[styles.ring, { transform: [{ rotate: dialRotateAnim }] }]}>
            <Text style={[styles.cardinal, styles.cardinalN]}>N</Text>
            <Text style={[styles.cardinal, styles.cardinalE]}>E</Text>
            <Text style={[styles.cardinal, styles.cardinalS]}>S</Text>
            <Text style={[styles.cardinal, styles.cardinalW]}>W</Text>
          </Animated.View>

          {/* Kaaba marker sitting at the Qibla direction on the ring */}
          <Animated.View
            style={[styles.markerWrap, { transform: [{ rotate: pointerRotateAnim }] }]}
            pointerEvents="none"
          >
            <View style={[styles.kaabaMarker, isAligned && styles.kaabaMarkerAligned]}>
              <Text style={styles.kaabaText}>🕋</Text>
            </View>
          </Animated.View>

          {/* 3D Qibla needle */}
          <Animated.View
            style={[
              styles.needle,
              { transform: [{ rotate: pointerRotateAnim }, { scale: needleScale }] },
            ]}
            pointerEvents="none"
          >
            {/* shadow ghost for depth */}
            <View style={[styles.needleUp, styles.needleShadow]} />
            {/* main colored head */}
            <View style={[styles.needleUp, { borderBottomColor: needleColor }]} />
            {/* glossy facet */}
            <View style={styles.needleGloss} />
            {/* grey tail */}
            <View style={styles.needleDown} />
          </Animated.View>

          {/* Center hub */}
          <View style={styles.hub}>
            <View style={[styles.hubRing, isAligned && { borderColor: GREEN }]} />
            <View style={[styles.hubDot, { backgroundColor: needleColor }]} />
          </View>
        </View>

        <Text style={[styles.helper, isAligned && styles.helperAligned]}>
          {isAligned
            ? 'Perfectly aligned — you are facing the Qibla'
            : compassReady
              ? 'Turn slowly until the arrow points up and turns green'
              : 'Calibrating compass… move your phone in a figure-8'}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Qibla</Text>
          <Text style={styles.statValue}>{Math.round(qiblaBearing)}°</Text>
        </View>
        {compassReady ? (
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Heading</Text>
            <Text style={styles.statValue}>{Math.round(heading)}°</Text>
          </View>
        ) : null}
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>To Makkah</Text>
          <Text style={styles.statValue}>{distanceKm.toLocaleString()} km</Text>
        </View>
      </View>
    </View>
  );
}

// Needle geometry.
const NEEDLE_HALF = 17;
const NEEDLE_UP = 104;
const NEEDLE_DOWN = 78;

const styles = StyleSheet.create({
  wrap: { marginTop: 14 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#EAF4FB',
    borderWidth: 1,
    borderColor: '#DCE9F4',
  },
  statusPillAligned: {
    backgroundColor: '#DFF5EC',
    borderColor: '#A8E5CC',
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#2E6FB0',
  },
  statusTextAligned: {
    color: GREEN,
  },

  compassCard: {
    backgroundColor: '#F3F8FC',
    borderRadius: 26,
    paddingVertical: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5EEF5',
  },
  compassCardAligned: {
    backgroundColor: '#F0FBF6',
    borderColor: '#BFEAD6',
  },

  dialOuter: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B2B4A',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  dialMid: {
    position: 'absolute',
    width: RING - 18,
    height: RING - 18,
    borderRadius: (RING - 18) / 2,
    backgroundColor: '#F7FAFD',
    borderWidth: 1,
    borderColor: '#E9F0F7',
  },
  dialInner: {
    position: 'absolute',
    width: RING - 64,
    height: RING - 64,
    borderRadius: (RING - 64) / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF3F8',
    shadowColor: '#0B2B4A',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  tickWrap: {
    position: 'absolute',
    width: RING,
    height: RING,
    alignItems: 'center',
  },
  tick: {
    marginTop: 8,
    width: 2,
    height: 8,
    borderRadius: 1,
    backgroundColor: '#CBD8E6',
  },
  tickMajor: {
    width: 3,
    height: 14,
    backgroundColor: '#9DB4CC',
  },
  glow: {
    position: 'absolute',
    width: RING - 40,
    height: RING - 40,
    borderRadius: (RING - 40) / 2,
    backgroundColor: 'rgba(22,163,107,0.14)',
    borderWidth: 2,
    borderColor: 'rgba(22,163,107,0.45)',
  },
  ring: {
    position: 'absolute',
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardinal: {
    position: 'absolute',
    fontSize: 17,
    fontWeight: '900',
    color: '#6C8190',
  },
  cardinalN: { top: 16, color: '#C0492F' },
  cardinalS: { bottom: 16 },
  cardinalE: { right: 18 },
  cardinalW: { left: 18 },

  markerWrap: {
    position: 'absolute',
    width: RING,
    height: RING,
    alignItems: 'center',
  },
  kaabaMarker: {
    marginTop: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E1B98A',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  kaabaMarkerAligned: {
    borderColor: GREEN,
  },
  kaabaText: { fontSize: 16 },

  needle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  needleUp: {
    width: 0,
    height: 0,
    borderLeftWidth: NEEDLE_HALF,
    borderRightWidth: NEEDLE_HALF,
    borderBottomWidth: NEEDLE_UP,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: BLUE,
  },
  needleShadow: {
    position: 'absolute',
    top: 3,
    borderBottomColor: 'rgba(11,43,74,0.18)',
  },
  needleGloss: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: NEEDLE_HALF * 0.42,
    borderRightWidth: NEEDLE_HALF * 0.42,
    borderBottomWidth: NEEDLE_UP,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255,255,255,0.40)',
  },
  needleDown: {
    width: 0,
    height: 0,
    borderLeftWidth: NEEDLE_HALF,
    borderRightWidth: NEEDLE_HALF,
    borderTopWidth: NEEDLE_DOWN,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#C7D3E0',
  },
  hub: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: '#DCE6F0',
    backgroundColor: '#FFFFFF',
  },
  hubDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: BLUE,
  },

  helper: {
    marginTop: 18,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#5E7282',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  helperAligned: {
    color: GREEN,
    fontWeight: '800',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5EEF5',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6C8190',
    textTransform: 'uppercase',
  },
  statValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '900',
    color: '#214C73',
  },
});
