import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../../../../theme/colors';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function AchievementRingCard({
  completed = 0,
  target = 40,
  label = 'Days',
}) {
  const safeTarget = Math.max(1, target);
  const safeCompleted = clamp(completed, 0, safeTarget);
  const percent = Math.round((safeCompleted / safeTarget) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.ringOuter}>
        <View style={styles.ringTrack} />

        <View
          style={[
            styles.progressArc,
            { transform: [{ rotate: `${(percent / 100) * 360}deg` }] },
          ]}
        >
          <View style={styles.progressArcHead} />
        </View>

        <View style={styles.ringInner}>
          <Text style={styles.valueLine}>
            <Text style={styles.valueStrong}>{safeCompleted}</Text>
            <Text style={styles.valueLabel}> {label}</Text>
          </Text>
          <Text style={styles.subValue}>of {safeTarget}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
  },
  ringOuter: {
    width: 170,
    height: 170,
    borderRadius: 85,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringTrack: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 10,
    borderColor: '#DCD9EE',
    opacity: 0.95,
  },
  progressArc: {
    position: 'absolute',
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  progressArcHead: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#BEE0DD',
    marginTop: -1,
  },
  ringInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueLine: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  valueStrong: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  valueLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  subValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
});
