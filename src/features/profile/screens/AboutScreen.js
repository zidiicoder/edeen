import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../../theme/colors';
import ProfileHeader from '../components/ProfileHeader';

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
      <ProfileHeader title="About Us" />
      <View style={styles.card}>
        <Text style={styles.title}>EDeen - 40 Days Challenge</Text>
        <Text style={styles.sub}>
          EDeen helps you build meaningful habits in a simple, guided way. We
          focus on consistency, faith-inspired motivation, and small daily wins.
        </Text>
        <Text style={styles.sub}>
          Track your habits, set reminders, and reflect daily to transform your
          routine over 40 days.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Our Mission</Text>
        <Text style={styles.sub}>
          To support people in building positive habits using thoughtful design
          and gentle accountability.
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
    marginBottom: 6,
  },
  sub: {
    fontSize: 12,
    color: '#5C5C5C',
    lineHeight: 18,
    marginTop: 6,
  },
});
