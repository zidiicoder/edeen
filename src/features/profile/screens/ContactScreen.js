import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../../theme/colors';
import ProfileHeader from '../components/ProfileHeader';

export default function ContactScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
      <ProfileHeader title="Contact Us" />
      <View style={styles.card}>
        <Text style={styles.title}>Email</Text>
        <Text style={styles.sub}>edeenapp@gmail.com</Text>
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
    marginTop: 12,
    backgroundColor: '#CFE4F5',
    borderRadius: 16,
    padding: 14,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sub: {
    marginTop: 6,
    fontSize: 12,
    color: '#5C5C5C',
  },
});
