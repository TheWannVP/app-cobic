import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Stack, router } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ChangePasswordScreen() {
  const colorScheme = useColorScheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
      return;
    }

    try {
      setChangePasswordLoading(true);
      await userService.changePassword(currentPassword, newPassword);
      Alert.alert('Thành công', 'Đổi mật khẩu thành công', [
        { text: 'OK', onPress: () => router.back() } // Quay lại trang trước sau khi thành công
      ]);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LoadingOverlay visible={changePasswordLoading} />
      <Stack.Screen options={{ title: 'Đổi mật khẩu' }} />
      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ThemedView style={styles.content}>
          <ThemedView style={styles.changePasswordForm}>
            <ThemedText style={styles.label}>Mật khẩu hiện tại</ThemedText>
            <TextInput
              style={[styles.input, {
                backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                color: Colors[colorScheme ?? 'light'].text
              }]}
              placeholder="Nhập mật khẩu hiện tại"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              editable={!changePasswordLoading}
            />
            <ThemedText style={styles.label}>Mật khẩu mới</ThemedText>
            <TextInput
              style={[styles.input, {
                backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                color: Colors[colorScheme ?? 'light'].text
              }]}
              placeholder="Nhập mật khẩu mới"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              editable={!changePasswordLoading}
            />
            <ThemedText style={styles.label}>Xác nhận mật khẩu mới</ThemedText>
            <TextInput
              style={[styles.input, {
                backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                color: Colors[colorScheme ?? 'light'].text
              }]}
              placeholder="Nhập lại mật khẩu mới"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!changePasswordLoading}
            />
            <TouchableOpacity 
              style={[styles.submitButton, changePasswordLoading && styles.submitButtonDisabled]}
              onPress={handleChangePassword}
              disabled={changePasswordLoading || !currentPassword || !newPassword || !confirmPassword}
            >
              <ThemedText style={styles.submitButtonText}>
                Xác nhận
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  changePasswordForm: {
    borderRadius: 8,
    padding: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#F5F3FF',
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#EDE9FE',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 