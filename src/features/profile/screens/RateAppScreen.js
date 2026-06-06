import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../../theme/colors';
import ProfileHeader from '../components/ProfileHeader';

const STORE_URLS = {
  ios: 'https://apps.apple.com/app/id000000000',
  android: 'https://play.google.com/store/apps/details?id=com.edeen',
};

export default function RateAppScreen() {
  const openStore = () => {
    const url = Platform.OS === 'ios' ? STORE_URLS.ios : STORE_URLS.android;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
      <ProfileHeader title="Rate as 5 Star" />
      <View style={styles.card}>
        <Text style={styles.title}>Enjoying EDeen?</Text>
        <Text style={styles.sub}>
          Your rating helps us improve. Tap below to open the store and leave a
          5-star review.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={openStore}>
          <Text style={styles.btnText}>Rate Now</Text>
        </TouchableOpacity>
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    marginTop: 16,
    backgroundColor: '#CFE4F5',
    borderRadius: 18,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sub: {
    marginTop: 8,
    fontSize: 12,
    color: '#5C5C5C',
    lineHeight: 18,
  },
  btn: {
    marginTop: 14,
    backgroundColor: '#78B8F6',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
