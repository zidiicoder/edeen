import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../../theme/colors';
import { AuthContext } from '../../../context/AuthContext';

const PROFILE_IMAGE_STORAGE_KEY = 'profile_image_uri';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const [customProfileImageUri, setCustomProfileImageUri] = useState(null);
  const getRootNavigation = () => {
    let current = navigation;
    while (current.getParent()) {
      current = current.getParent();
    }
    return current;
  };
  const profile = {
    name: user?.name,
    email: user?.email,
    phone: user?.phone,
    city: user?.city,
    state: user?.state 
  };
  const profileImageUri =
    customProfileImageUri ||
    user?.profile_image ||
    user?.profileImage ||
    user?.avatar ||
    user?.image ||
    null;

  const locationLabel = useMemo(() => {
    const city = (profile.city || '').trim();
    const state = (profile.state || '').trim();
    if (city && state) return `${city}, ${state}`;
    return city || state || '';
  }, [profile.city, profile.state]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      // ignore
    }
    const root = getRootNavigation();
    if (root) {
      root.navigate('Auth');
    } else {
      navigation.navigate('Login');
    }
  };

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const loadProfileImage = async () => {
        try {
          const storedUri = await AsyncStorage.getItem(PROFILE_IMAGE_STORAGE_KEY);
          if (mounted) {
            setCustomProfileImageUri(storedUri || null);
          }
        } catch (e) {
          if (mounted) {
            setCustomProfileImageUri(null);
          }
        }
      };

      loadProfileImage();

      return () => {
        mounted = false;
      };
    }, []),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>

        <View style={styles.profileRow}>
          <TouchableOpacity
            style={styles.avatarWrap}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ProfileEdit')}
          >
            <Image
              source={
                profileImageUri
                  ? { uri: profileImageUri }
                  : require('../../../assets/images/Edeen (1).png')
              }
              style={styles.avatar}
            />
            <View style={styles.avatarEditBadge}>
              <Feather name="camera" size={12} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.profileText}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.email}>{profile.email}</Text>
            <Text style={styles.metaText}>{profile.phone}</Text>
            {locationLabel ? (
              <Text style={styles.metaText}>{locationLabel}</Text>
            ) : null}
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('ProfileEdit')}
            >
              <Text style={styles.editText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.listCard}>
        <RowItem icon="share-2" text="Share This App" onPress={() => navigation.navigate('ShareApp')} />
        <RowItem icon="star" text="Rate as 5 Star" onPress={() => navigation.navigate('RateApp')} />
      </View>

      <View style={styles.listCard}>
        <RowItem icon="info" text="About us" onPress={() => navigation.navigate('About')} />
        <RowItem icon="phone" text="Contact us" onPress={() => navigation.navigate('Contact')} />
        <RowItem icon="file-text" text="Terms of use" onPress={() => navigation.navigate('Terms')} />
        <RowItem icon="shield" text="Data Privacy" onPress={() => navigation.navigate('Privacy')} />
      </View>

      <View style={styles.listCard}>
        <RowItem icon="lock" text="Change Password" onPress={() => navigation.navigate('ChangePassword')} />
        <RowItem icon="log-out" text="logout" onPress={handleLogout} />
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RowItem({ icon, text, onPress }) {
  return (
    <TouchableOpacity style={styles.rowItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        <Feather name={icon} size={18} color={colors.textPrimary} />
        <Text style={styles.rowText}>{text}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textPrimary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerCard: {
    backgroundColor: '#CFE4F5',
    borderRadius: 24,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  avatarWrap: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#DDEBF7',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarEditBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#78B8F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#CFE4F5',
  },
  profileText: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  email: {
    fontSize: 12,
    color: '#5C5C5C',
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#5C5C5C',
    marginTop: 2,
  },
  editBtn: {
    marginTop: 8,
    backgroundColor: '#78B8F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  editText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  listCard: {
    backgroundColor: '#CFE4F5',
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
});
