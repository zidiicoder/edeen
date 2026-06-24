import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../../theme/colors';
import { AuthContext } from '../../../context/AuthContext';
import { profileEditValidationSchema } from '../../../validation/validate';
import { handleBatchErrors } from '../../../utils';
import { request } from '../../../utils/api';
import {
  ensureUserNotificationPermission,
  getFCMToken,
} from '../../../utils/notifications';

const PROFILE_IMAGE_STORAGE_KEY = 'profile_image_uri';

function getImagePickerModule() {
  try {
    return require('react-native-image-picker');
  } catch (e) {
    return null;
  }
}

export default function ProfileEditScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useContext(AuthContext);
  const getRootNavigation = () => {
    let current = navigation;
    while (current.getParent()) {
      current = current.getParent();
    }
    return current;
  };
  const [form, setForm] = useState({
    name: user?.name,
    email: user?.email,
    phone: user?.phone,
    city: user?.city,
    state: user?.state
  });
  const [errors, setErrors] = useState({});
  const [localProfileImageUri, setLocalProfileImageUri] = useState(null);
  const profileImageUri =
    localProfileImageUri ||
    user?.profile_image ||
    user?.profileImage ||
    user?.avatar ||
    user?.image;

  useEffect(() => {
    if (!user) return;
    setForm(prev => ({
      ...prev,
      name: user?.name || prev.name,
      email: user?.email || prev.email,
      phone: user?.phone || prev.phone,
      city: user?.city || prev.city,
      state: user?.state || prev.state,
    }));
  }, [user]);

  useEffect(() => {
    let mounted = true;
    const loadStoredImage = async () => {
      try {
        const storedUri = await AsyncStorage.getItem(PROFILE_IMAGE_STORAGE_KEY);
        if (mounted) {
          setLocalProfileImageUri(storedUri || null);
        }
      } catch (e) {
        if (mounted) {
          setLocalProfileImageUri(null);
        }
      }
    };

    loadStoredImage();

    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const handleLogout = async () => {
    try {
      // Save Remember Me credentials before clearing
      const rememberMe = await AsyncStorage.getItem('remember_me');
      const rememberedEmail = await AsyncStorage.getItem('remembered_email');
      const rememberedPassword = await AsyncStorage.getItem('remembered_password');
      
      // Clear all storage
      await AsyncStorage.clear();
      
      // Restore Remember Me credentials if they existed
      if (rememberMe === 'true' && rememberedEmail && rememberedPassword) {
        await AsyncStorage.setItem('remember_me', 'true');
        await AsyncStorage.setItem('remembered_email', rememberedEmail);
        await AsyncStorage.setItem('remembered_password', rememberedPassword);
      }
    } catch (e) {
      // ignore
    }
    
    // Reset navigation stack to Auth screen - prevents going back to authenticated screens
    const root = getRootNavigation();
    if (root) {
      root.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        })
      );
    } else {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    }
  };

  const handleSave = async () => {
    try {
      await profileEditValidationSchema.validate(form, { abortEarly: false });
      setErrors({});

      const hasPermission = await ensureUserNotificationPermission();
      const token = hasPermission ? await getFCMToken() : null;

      const payload = {
        ...form,
        ...(token ? { device_token: token } : {}),
      };

      const res = await request({
        url: 'profile',
        method: 'PUT',
        data: payload,
      });
      if (res.status === 'success') {
        const nextUser = res?.data?.user || {};
        if (updateUser) {
          await updateUser(nextUser);
        } else {
          await AsyncStorage.setItem('user', JSON.stringify(nextUser));
        }

        if (navigation.canGoBack()) {
          navigation.goBack();
          return;
        }

        const root = getRootNavigation();
        if (root) {
          root.navigate('Main', { screen: 'MainTabs' });
          return;
        }

        navigation.navigate('MainTabs');
      }
    } catch (validationError) {
      handleBatchErrors(validationError, setErrors);
    }
  };

  const handleAvatarPress = async () => {
    const imagePicker = getImagePickerModule();

    if (!imagePicker?.launchImageLibrary) {
      Alert.alert(
        'Image Picker Missing',
        'Install react-native-image-picker to enable profile photo upload.',
      );
      return;
    }

    try {
      const response = await imagePicker.launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
      });

      if (response?.didCancel) return;
      if (response?.errorCode) {
        Alert.alert(
          'Upload Failed',
          response.errorMessage || 'Unable to select image.',
        );
        return;
      }

      const asset = response?.assets?.[0];
      const nextUri = asset?.uri;
      if (!nextUri) return;

      setLocalProfileImageUri(nextUri);

      try {
        await AsyncStorage.setItem(PROFILE_IMAGE_STORAGE_KEY, nextUri);
      } catch (e) {
        // ignore storage failure; preview still updates for current session
      }
    } catch (e) {
      Alert.alert(
        'Upload Failed',
        e?.message || 'Something went wrong while opening image picker.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: insets.bottom + 110 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.backBtn} />
        </View>

      <TouchableOpacity
        style={styles.avatarWrap}
        activeOpacity={0.85}
        onPress={handleAvatarPress}
      >
        <Image
          source={
            profileImageUri
              ? { uri: profileImageUri }
              : require('../../../assets/images/edeen-welcome.png')
          }
          style={styles.avatar}
        />
        <View style={styles.editIcon}>
          <Feather name="camera" size={14} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      <Text style={styles.name}>{form.name || user?.name}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Your Name</Text>
        <View style={styles.inputWrap}>
          <Feather name="user" size={16} color="#9A9A9A" />
          <TextInput
            value={form.name}
            onChangeText={text => updateField('name', text)}
            placeholder="Your name"
            style={styles.input}
          />
        </View>
        {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Your Email</Text>
        <View style={[styles.inputWrap, styles.inputDisabled]}>
          <Feather name="mail" size={16} color="#9A9A9A" />
          <TextInput
            value={user?.email || form.email}
            placeholder="xxx@gmail.com"
            style={styles.input}
            editable={false}
            selectTextOnFocus={false}
          />
        </View>
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.inputWrap}>
          <Feather name="phone" size={16} color="#9A9A9A" />
          <TextInput
            value={form.phone}
            onChangeText={text => updateField('phone', text)}
            placeholder="+xxxxxxxx"
            style={styles.input}
            keyboardType="phone-pad"
          />
        </View>
        {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>City</Text>
        <View style={styles.inputWrap}>
          <Feather name="map-pin" size={16} color="#9A9A9A" />
          <TextInput
            value={form.city}
            onChangeText={text => updateField('city', text)}
            placeholder="Enter city"
            style={styles.input}
          />
        </View>
        {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>State</Text>
        <View style={styles.inputWrap}>
          <Feather name="map" size={16} color="#9A9A9A" />
          <TextInput
            value={form.state}
            onChangeText={text => updateField('state', text)}
            placeholder="Enter state"
            style={styles.input}
            autoCapitalize="characters"
            maxLength={20}
          />
        </View>
        {errors.state ? <Text style={styles.errorText}>{errors.state}</Text> : null}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardWrap: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#F7EBCB',
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E6E6E6',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 20,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  editIcon: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F29B4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    textAlign: 'center',
    marginTop: 14,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  role: {
    textAlign: 'center',
    marginTop: 4,
    fontSize: 12,
    color: '#8B7B67',
  },
  field: {
    marginTop: 18,
  },
  label: {
    fontSize: 12,
    color: '#6B5D4C',
    marginBottom: 6,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDF5DD',
    borderWidth: 1,
    borderColor: '#E0CFA6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  inputDisabled: {
    backgroundColor: '#F2E8C9',
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
  },
  errorText: {
    marginTop: 6,
    fontSize: 11,
    color: '#C0392B',
  },
  saveBtn: {
    marginTop: 22,
    backgroundColor: '#F29B4B',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  logoutBtn: {
    marginTop: 26,
    borderWidth: 1,
    borderColor: '#F29B4B',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#F29B4B',
    fontWeight: '700',
  },
});
