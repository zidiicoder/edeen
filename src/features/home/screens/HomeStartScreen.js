import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from "react-native-safe-area-context";
const { width } = Dimensions.get('window');

export default function HomeStartScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <ImageBackground
          source={require('../../../assets/images/40days back image.png')}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.logoArea}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </ImageBackground>
        <View style={styles.content}>
          <Text style={styles.title}>40 Days{'\n'}Challenge</Text>

          <Text style={styles.subtitle}>Lets Start Your Habits</Text>
          <Text style={styles.subtitle2}>
            Build lasting habits, one day at a time
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.cta}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.ctaText}>Start Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* HERO */
  hero: {
    width: '100%',
    height: 430, 
    backgroundColor: '#FFFFFF',
  },
  heroImage: {
    resizeMode: 'cover',
  },

  /* Logo inside hero */
  logoArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 10,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 700,
    height: 700,
  },

  /* CONTENT */
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 6, // reference mein logo ke baad thora gap
  },

  title: {
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '900',
    color: '#111111',
    textAlign: 'center',
    marginTop: 8,
  },

  subtitle: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B5D4C',
    textAlign: 'center',
  },

  subtitle2: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B5D4C',
    textAlign: 'center',
  },

  /* Button */
  cta: {
    marginTop: 30,
    marginBottom: 20,
    width: '88%',
    height: 56,
    backgroundColor: '#F6E6B8',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#1B1B1B',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
