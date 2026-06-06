import React, { useEffect, useState } from 'react';
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

import colors from '../../../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { handleBatchErrors } from '../../../utils';
import { request } from '../../../utils/api';
import { changePasswordValidationSchema } from '../../../validation/validate';

export default function ForgotPasswordChangeScreen() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({
    code: '',
    password: '',
    confirm_password: '',
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  useEffect(() => {
    const loadEmail = async () => {
      const storedEmail = await AsyncStorage.getItem('email');
      if (storedEmail) {
        setEmail(storedEmail);
      }
    };

    loadEmail();
  }, []);

  const handleResetPassword = async () => {
    setLoading(true);
    setErrors({});
    setApiError('');

    try {
      await changePasswordValidationSchema.validate(form, {
        abortEarly: false,
      });
      const payload = {
        email: email,
        code: form.code,
        password: form.password,
        password_confirmation: form.confirm_password,
      };
      const res = await request({
        url: 'reset-password',
        method: 'POST',
        data: payload,
      });
      navigation.navigate('Login');
    } catch (err) {
      if (err?.inner) {
        handleBatchErrors(err, setErrors);
      } else {
        setApiError('Something went wrong. Please try again.');
      }
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Image
          source={require('../../../assets/images/Edeen (1) (1).png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter OTP code and set your new password
        </Text>
        <View style={styles.inputGroup}>
          <View
            style={[
              styles.inputWrap,
              errors.code ? styles.inputErrorBorder : null,
            ]}
          >
            <TextInput
              placeholder="Enter OTP Code"
              placeholderTextColor="#9B9B9B"
              style={styles.input}
              value={form.code}
              onChangeText={text => handleChange('code', text)}
            />
          </View>
          {errors.code && <Text style={styles.errorText}>{errors.code}</Text>}

          <View
            style={[
              styles.inputWrap,
              errors.password ? styles.inputErrorBorder : null,
            ]}
          >
            <TextInput
              placeholder="New Password"
              placeholderTextColor="#9B9B9B"
              style={styles.input}
              secureTextEntry
              value={form.password}
              onChangeText={text => handleChange('password', text)}
            />
          </View>
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          <View
            style={[
              styles.inputWrap,
              errors.confirm_password ? styles.inputErrorBorder : null,
            ]}
          >
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#9B9B9B"
              style={styles.input}
              secureTextEntry
              value={form.confirm_password}
              onChangeText={text => handleChange('confirm_password', text)}
            />
          </View>
          {errors.confirm_password && (
            <Text style={styles.errorText}>{errors.confirm_password}</Text>
          )}
          {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}

          <TouchableOpacity
            style={styles.cta}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.ctaText}>Reset Password</Text>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>
              Back to <Text style={styles.linkStrong}>Login</Text>
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

  inputErrorBorder: {
    borderWidth: 1,
    borderColor: 'red',
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
