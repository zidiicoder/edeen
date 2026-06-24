import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../../theme/colors';
import ProfileHeader from '../components/ProfileHeader';
import { request } from '../../../utils/api';
import { handleBatchErrors } from '../../../utils';
import { profileChangePasswordValidationSchema } from '../../../validation/changePasswordValidation';

export default function ChangePasswordScreen() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const handleChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleChangePassword = async () => {
    try {
      setLoading(true);
      setErrors({});
      setApiError('');

      await profileChangePasswordValidationSchema.validate(form, {
        abortEarly: false,
      });

      await request({
        url: 'change-password',
        method: 'POST',
        data: {
          current_password: form.current_password,
          new_password: form.new_password,
          new_password_confirmation: form.new_password_confirmation,
        },
      });

      setForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (error) {
      if (error?.inner) {
        handleBatchErrors(error, setErrors);
      } else {
        setApiError('Unable to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <ProfileHeader title="Change Password" />
        <View style={styles.card}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            secureTextEntry
            placeholder="Current Password"
            style={[
              styles.input,
              errors.current_password ? styles.inputErrorBorder : null,
            ]}
            value={form.current_password}
            onChangeText={text => handleChange('current_password', text)}
          />
          {errors.current_password ? (
            <Text style={styles.errorText}>{errors.current_password}</Text>
          ) : null}

          <Text style={styles.label}>New Password</Text>
          <TextInput
            secureTextEntry
            placeholder="New Password"
            style={[
              styles.input,
              errors.new_password ? styles.inputErrorBorder : null,
            ]}
            value={form.new_password}
            onChangeText={text => handleChange('new_password', text)}
          />
          {errors.new_password ? (
            <Text style={styles.errorText}>{errors.new_password}</Text>
          ) : null}

          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            secureTextEntry
            placeholder="Confirm New Password"
            style={[
              styles.input,
              errors.new_password_confirmation ? styles.inputErrorBorder : null,
            ]}
            value={form.new_password_confirmation}
            onChangeText={text => handleChange('new_password_confirmation', text)}
          />
          {errors.new_password_confirmation ? (
            <Text style={styles.errorText}>
              {errors.new_password_confirmation}
            </Text>
          ) : null}
          {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.btnText}>Update Password</Text>
            )}
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
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 10,
  },
  input: {
    marginTop: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  btn: {
    marginTop: 16,
    backgroundColor: '#78B8F6',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.65,
  },
  inputErrorBorder: {
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  errorText: {
    marginTop: 4,
    fontSize: 11,
    color: '#C0392B',
  },
});
