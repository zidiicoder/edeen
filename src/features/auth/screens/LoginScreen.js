import { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: '' }); 
  };

  const loginUser = async () => {
    // Blur the inputs so the OS captures the final values (helps the autofill
    // "save password" prompt recognise the submitted credentials).
    Keyboard.dismiss();
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
      
      // Save credentials if Remember Me is checked
      if (rememberMe) {
        await AsyncStorage.setItem('remembered_email', form.email);
        await AsyncStorage.setItem('remembered_password', form.password);
        await AsyncStorage.setItem('remember_me', 'true');
      } else {
        // Clear saved credentials if Remember Me is unchecked
        await AsyncStorage.removeItem('remembered_email');
        await AsyncStorage.removeItem('remembered_password');
        await AsyncStorage.removeItem('remember_me');
      }
      
      // Reset the ROOT navigator (Main lives there, not in the AuthStack) so the
      // Login screen UNMOUNTS. That unmount is what makes the OS autofill
      // framework "commit" the entered credentials and show the native
      // "Save password?" prompt (Android needs the field session to end; iOS
      // offers to save once the password field is submitted and dismissed).
      const rootNav = navigation.getParent() || navigation;
      rootNav.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (validationError) {
      handleBatchErrors(validationError, setErrors);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    AsyncStorage.setItem('isShowSplashScreen', JSON.stringify(true));
    
    // Load saved credentials if Remember Me was enabled
    const loadSavedCredentials = async () => {
      try {
        const savedRememberMe = await AsyncStorage.getItem('remember_me');
        if (savedRememberMe === 'true') {
          const savedEmail = await AsyncStorage.getItem('remembered_email');
          const savedPassword = await AsyncStorage.getItem('remembered_password');
          
          if (savedEmail && savedPassword) {
            setForm({
              email: savedEmail,
              password: savedPassword,
            });
            setRememberMe(true);
          }
        }
      } catch (error) {
        // Ignore errors loading saved credentials
      }
    };
    
    loadSavedCredentials();
  }, [])

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Image
          source={require('../../../assets/images/edeen-logo.png')}
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
              autoCorrect={false}
              autoComplete="email"
              textContentType="username"
              importantForAutofill="yes"
              returnKeyType="next"
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
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType="password"
              importantForAutofill="yes"
              returnKeyType="go"
              onSubmitEditing={loginUser}
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
          {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}
          
          <View style={styles.rememberForgotRow}>
            <TouchableOpacity
              style={styles.rememberMeRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={rememberMe ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={22}
                color={rememberMe ? colors.button : '#9B9B9B'}
              />
              <Text style={styles.rememberMeText}>Remember Me</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => navigation.navigate('Forgot')}
              activeOpacity={0.7}
            >
              <Text style={styles.forgot}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    color: colors.textPrimary,
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

  rememberForgotRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  rememberMeText: {
    color: colors.textMuted,
    fontSize: 12,
  },

  forgot: {
    color: colors.textMuted,
    fontSize: 12,
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
