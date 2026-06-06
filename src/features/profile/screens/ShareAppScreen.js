import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../../theme/colors';
import ProfileHeader from '../components/ProfileHeader';

export default function ShareAppScreen() {
  const onShare = async () => {
    try {
      await Share.share({
        title: 'EDeen App',
        message: 'Check out EDeen app! Build habits in 40 days. Download now.',
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
      <ProfileHeader title="Share This App" />
      <View style={styles.card}>
        <Text style={styles.title}>Invite your friends</Text>
        <Text style={styles.sub}>
          Share EDeen with your family and friends. The share sheet will open
          from the bottom.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={onShare}>
          <Text style={styles.btnText}>Share Now</Text>
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
