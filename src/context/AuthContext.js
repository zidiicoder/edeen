import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { request } from '../utils/api';
import {
  ensureUserNotificationPermission,
  getFCMToken,
} from '../utils/notifications';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        const userData = await AsyncStorage.getItem('user');

        let parsedUser = null;
        
        if (userData) {
          try {
            parsedUser = JSON.parse(userData);
          } catch (error) {
            parsedUser = null;
          }
        }

        if (token) {
          setUser({
            access_token: token,
            ...(parsedUser || {}),
          });
        }
      } catch (error) {
        console.log('Auth Load Error:', error);
      }

      setLoading(false);
    };

    loadAuthData();
  }, []);

  const storeAuthData = async response => {
    const { expires_in, access_token, user } = response.data;

    try {
      // Token
      if (access_token) {
        await AsyncStorage.setItem('access_token', access_token);
      }

      // User
      if (user) {
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }

      // Expire
      if (expires_in !== undefined && expires_in !== null) {
        await AsyncStorage.setItem('expire', String(expires_in));
      } else {
        await AsyncStorage.removeItem('expire');
      }

      // Update State
      setUser({
        ...(user || {}),
        ...(access_token ? { access_token } : {}),
      });
    } catch (error) {
      console.log('Store Auth Error:', error);
    }
  };

  const removeAuthData = async () => {
    try {
      await AsyncStorage.multiRemove([
        'access_token',
        'user',
        'permissions',
        'expire',
        'nova_role',
        'email',
      ]);

      setUser(null);
    } catch (error) {
      console.log('Remove Auth Error:', error);
    }
  };

  const verifyOTP = async code => {
    try {
      const email = await AsyncStorage.getItem('email');
      const formData = new FormData();
      formData.append('code', code);
      formData.append('email', email);
      const response = await request({
        url: 'verify',
        method: 'POST',
        data: formData,
      });
      return { isError: false, response };
    } catch (error) {
      return { isError: true, error };
    }
  };

  const getOTP = async () => {
    try {
      const response = await request({
        url: 'get-otp',
        method: 'GET',
      });

      return { isError: false, response };
    } catch (error) {
      return { isError: true, error };
    }
  };

  const login = async (email, password) => {
    try {
      await AsyncStorage.setItem('email', email);

      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const response = await request({
        url: 'login',
        method: 'POST',
        data: formData,
      });

      await storeAuthData(response);

      try {
        const hasPermission = await ensureUserNotificationPermission();
        const token = hasPermission ? await getFCMToken() : null;

        if (token) {
          await request({
            url: 'device-token',
            method: 'PUT',
            data: { device_token: token },
          });
        }
      } catch (deviceTokenError) {
        console.log('Device Token Update Error:', deviceTokenError);
      }

      return { isError: false, response };
    } catch (error) {
      return { isError: true, error };
    }
  };

  const signUp = async (name, email, password, confirmPassword) => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('password_confirmation', confirmPassword);

      const response = await request({
        url: 'signup',
        method: 'POST',
        data: formData,
      });
      return { isError: false, response };
    } catch (error) {
      return { isError: true, error };
    }
  };

  const logoutUser = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');

      const formData = new FormData();
      formData.append('token', token);

      await request({
        url: 'logout',
        method: 'POST',
        data: formData,
      });
    } catch (err) {
      console.log('Logout API Error:', err);
    }
  };

  const forgotPassword = async email => {
    try {
      const formData = new FormData();
      formData.append('email', email);

      const response = await request({
        url: 'forgot-password',
        method: 'POST',
        data: formData,
      });
      return { isError: false, response };
    } catch (error) {
      return { isError: true, error };
    }
  };

  const logout = async () => {
    await logoutUser();
    await removeAuthData();
  };

  const updateUser = async nextUser => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(nextUser || {}));
    } catch (error) {
      console.log('Update User Storage Error:', error);
    } finally {
      setUser(prev => ({
        ...(prev || {}),
        ...(nextUser || {}),
      }));
    }
  };

  const isAuthenticated = () => {
    return user && user.access_token;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signUp,
        logout,
        loading,
        verifyOTP,
        getOTP,
        forgotPassword,
        updateUser,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
