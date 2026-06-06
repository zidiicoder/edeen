import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from '../context/AuthContext';
import StartScreen from '../features/onboarding/screens/StartScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';
import ForgotPassword from '../features/auth/screens/ForgotPassword';
import HomeStack from './HomeStack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VerifyOTPScreen from '../features/auth/screens/VerifyOTPScreen';
import ForgotPasswordChangeScreen from '../features/auth/screens/ForgotPasswordChangeScreen';
import {
  View,
  ActivityIndicator,
} from 'react-native';

const Stack = createNativeStackNavigator();
function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Start" component={StartScreen} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Forgot" component={ForgotPassword} />
      <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
      <Stack.Screen name="ForgotPasswordChange" component={ForgotPasswordChangeScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAppState = async () => {
      try {
        const splashValue = await AsyncStorage.getItem(
          'isShowSplashScreen'
        );

        if (splashValue !== 'true') {
          setShowOnboarding(true);
        }
        const token = await AsyncStorage.getItem('access_token');

        if (token) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.log('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAppState();
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const initialRouteName = showOnboarding
    ? 'Onboarding'
    : isLoggedIn
      ? 'Main'
      : 'Auth';

  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRouteName}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen
            name="Onboarding"
            component={OnboardingStack}
          />
          <Stack.Screen name="Auth" component={AuthStack} />
          <Stack.Screen name="Main" component={HomeStack} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
