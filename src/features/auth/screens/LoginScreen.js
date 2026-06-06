import { useContext, useEffect, useState } from 'react';
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

import { AuthContext } from '../../../context/AuthContext';
import { loginValidationSchema } from '../../../validation/validate';
import { handleBatchErrors } from '../../../utils';
import colors from '../../../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: '' }); 
  };

  const loginUser = async () => {
    setApiError('');
    setErrors({});
    setLoading(true);

    try {
      await loginValidationSchema.validate(form, { abortEarly: false });
      const result = await login(form.email, form.password);

      if (result.isError) {
        setApiError('Invalid credentials. Please try again.');
        setLoading(false);
        return;
      }
      navigation.navigate('Main');
    } catch (validationError) {
      handleBatchErrors(validationError, setErrors);
    } finally {
      setLoading(false);
    }
  };

   useEffect(()=>{
      AsyncStorage.setItem('isShowSplashScreen', JSON.stringify(true));
    },[])

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Image
          source={require('../../../assets/images/Edeen (1) (1).png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Welcome Back!</Text>
        <View style={styles.inputGroup}>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="Email"
              placeholderTextColor="#9B9B9B"
              style={styles.input}
              value={form.email}
              onChangeText={text => handleChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <View style={styles.inputWrap}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#9B9B9B"
              style={styles.input}
              value={form.password}
              onChangeText={text => handleChange('password', text)}
              secureTextEntry
            />
          </View>
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}
          {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}
          <TouchableOpacity
            onPress={() => navigation.navigate('Forgot')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cta}
            onPress={loginUser}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.ctaText}>Sign In</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>
              Don’t have an account?{' '}
              <Text style={styles.linkStrong}>Sign Up</Text>
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

  forgot: {
    color: colors.textMuted,
    fontSize: 12,
    alignSelf: 'flex-end',
    marginBottom: 10,
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
