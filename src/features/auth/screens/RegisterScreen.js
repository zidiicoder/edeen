import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import colors from '../../../theme/colors';
import { AuthContext } from '../../../context/AuthContext';
import { handleBatchErrors } from '../../../utils';
import { registerValidationSchema } from '../../../validation/validate';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { signUp } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: '' }); 
  };

  const handleRegister = async () => {
    setLoading(true);
    setErrors({});
    setApiError('');
    AsyncStorage.setItem('email', form.email);
    try {
      await registerValidationSchema.validate(form, { abortEarly: false });
      const result = await signUp(
        form.name,
        form.email,
        form.password,
        form.confirm_password,
      );
      if (result.isError) {
        if (result.error) handleBatchErrors(result.error, setErrors);
        else setApiError('Something went wrong. Please try again.');
        setLoading(false);
        return;
      }
      navigation.navigate('VerifyOTP');
    } catch (validationError) {
      handleBatchErrors(validationError, setErrors);
    }

    setLoading(false);
  };

  useEffect(()=>{
    AsyncStorage.setItem('isShowSplashScreen', 'true');
  },[])

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Image
          source={require('../../../assets/images/edeen-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Welcome Onboard!</Text>
        <Text style={styles.subtitle}>Let's help you meet up your tasks</Text>

        <View style={styles.inputGroup}>
          <View
            style={[
              styles.inputWrap,
              errors.name ? styles.inputErrorBorder : null,
            ]}
          >
            <TextInput
              placeholder="User Name"
              placeholderTextColor="#9B9B9B"
              style={styles.input}
              value={form.name}
              onChangeText={text => handleChange('name', text)}
            />
          </View>
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          <View
            style={[
              styles.inputWrap,
              errors.email ? styles.inputErrorBorder : null,
            ]}
          >
            <TextInput
              placeholder="Email"
              placeholderTextColor="#9B9B9B"
              style={styles.input}
              value={form.email}
              onChangeText={text => handleChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          <View
            style={[
              styles.inputWrap,
              errors.password ? styles.inputErrorBorder : null,
            ]}
          >
            <TextInput
              placeholder="Password"
              placeholderTextColor="#9B9B9B"
              style={styles.input}
              value={form.password}
              onChangeText={text => handleChange('password', text)}
              secureTextEntry={!showPassword}
              autoComplete="password-new"
              textContentType="newPassword"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              <Feather
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color="#9B9B9B"
              />
            </TouchableOpacity>
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
              value={form.confirm_password}
              onChangeText={text => handleChange('confirm_password', text)}
              secureTextEntry={!showConfirmPassword}
              autoComplete="password-new"
              textContentType="newPassword"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              activeOpacity={0.7}
            >
              <Feather
                name={showConfirmPassword ? 'eye' : 'eye-off'}
                size={20}
                color="#9B9B9B"
              />
            </TouchableOpacity>
          </View>
          {errors.confirm_password && (
            <Text style={styles.errorText}>{errors.confirm_password}</Text>
          )}
          {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}
          <TouchableOpacity
            style={styles.cta}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.ctaText}>Register</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.linkStrong}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: { width: 140, height: 140, marginBottom: 12 },
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
  inputGroup: { width: '100%', marginTop: 10, alignItems: 'center' },
  inputWrap: {
    width: '100%',
    backgroundColor: colors.inputBg,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { 
    flex: 1,
    color: colors.textPrimary 
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorText: {
    width: '100%',
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 5,
  },
  inputErrorBorder: { borderWidth: 1, borderColor: 'red' },
  cta: {
    backgroundColor: colors.button,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    marginTop: 4,
  },
  ctaText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  linkText: { marginTop: 14, color: colors.textMuted, fontSize: 12 },
  linkStrong: { color: colors.link, fontWeight: '600' },
});
