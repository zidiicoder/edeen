import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import colors from '../../theme/colors';

export default function ConfirmationModal({
  visible,
  title = 'Confirm Action',
  message = 'Are you sure you want to continue?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  confirmVariant = 'danger',
  iconName = 'alert-triangle',
}) {
  const confirmStyle =
    confirmVariant === 'danger' ? styles.confirmDanger : styles.confirmPrimary;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={loading ? undefined : onCancel}
    >
      <Pressable
        style={styles.overlay}
        onPress={loading ? undefined : onCancel}
      >
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.iconWrap}>
            <Feather name={iconName} size={22} color="#C85B5B" />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnGhost]}
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.btnGhostText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnConfirm, confirmStyle]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.btnConfirmText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    padding: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FBE4E4',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: '#666666',
    textAlign: 'center',
  },
  actions: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  btnGhost: {
    backgroundColor: '#F5F6F8',
  },
  btnGhostText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  btnConfirm: {
    borderWidth: 0,
  },
  confirmDanger: {
    backgroundColor: '#E36C6C',
  },
  confirmPrimary: {
    backgroundColor: '#78B8F6',
  },
  btnConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
