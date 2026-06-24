import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../../theme/colors';
import ProfileHeader from '../components/ProfileHeader';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
      <ProfileHeader title="Terms of Use" />
      <View style={styles.card}>
        <Text style={styles.title}>Terms Summary</Text>
        <Text style={styles.sub}>
          By using EDeen, you agree to use the app responsibly. Content provided
          is for personal guidance and habit tracking only.
        </Text>
        <Text style={styles.sub}>
          Do not misuse or attempt to reverse engineer the application.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.sub}>
          Keep your account secure and notify us if you suspect unauthorized
          access.
        </Text>
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
});
