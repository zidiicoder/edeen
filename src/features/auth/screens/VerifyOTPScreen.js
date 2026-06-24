import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import colors from '../../../theme/colors';
import { AuthContext } from '../../../context/AuthContext';
import { request } from '../../../utils/api';

export default function VerifyOTPScreen() {
  const navigation = useNavigation();
  const { verifyOTP } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleCodeChange = value => {
    const normalized = value.replace(/[^0-9]/g, '');
    setCode(normalized);
    setError('');
    setSuccessMessage('');
  };

  const handleVerify = async () => {
    setError('');
    setSuccessMessage('');
    if (!code.trim()) {
      setError('OTP is required');
      return;
    }
    try {
      setLoading(true);
      const result = await verifyOTP(code.trim());

      if (result.isError) {
        setError('Invalid OTP. Please try again.');
        setLoading(false);
        return;
      }
      setLoading(false);
      navigation.navigate('Login');
    } catch (error) {
      handleBatchErrors(error, setError);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccessMessage('');
    try {
      setResendLoading(true);
      const email = await AsyncStorage.getItem('email');
      const formData = new FormData();
      formData.append('email', email || '');

      await request({
        url: 'resend-otp',
        method: 'POST',
        data: formData,
      });

      setSuccessMessage('A new OTP has been sent.');
    } catch (_error) {
      setError('Unable to resend OTP right now. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Image
          source={require('../../../assets/images/edeen-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter the code sent to your email</Text>

        <View style={styles.inputGroup}>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="Enter OTP"
              placeholderTextColor="#9B9B9B"
              style={styles.input}
              value={code}
              onChangeText={handleCodeChange}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {successMessage ? (
            <Text style={styles.successText}>{successMessage}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.cta}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.ctaText}>Verify</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResend}
            activeOpacity={0.7}
            disabled={resendLoading}
          >
            <Text style={styles.linkText}>
              Didn't receive code?{' '}
              <Text style={styles.linkStrong}>
                {resendLoading ? 'Sending...' : 'Resend OTP'}
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>
              Back to <Text style={styles.linkStrong}>Sign In</Text>
            </Text>
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
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: 140,
    height: 140,
    marginBottom: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 6,
  },

  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: 16,
  },

  inputGroup: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
  },

  inputWrap: {
    width: '100%',
    backgroundColor: colors.inputBg,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },

  input: {
    color: colors.textPrimary,
  },

  errorText: {
    width: '100%',
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 5,
  },

  successText: {
    width: '100%',
    color: '#0F8F4B',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 5,
  },

  cta: {
    backgroundColor: colors.button,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    marginTop: 4,
  },

  ctaText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  linkText: {
    marginTop: 14,
    color: colors.textMuted,
    fontSize: 12,
  },

  linkStrong: {
    color: colors.link,
    fontWeight: '600',
  },
});
