import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { userService } from '@/services/user.service';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

export default function UpdateProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    dateOfBirth: '',
    country: '',
    address: '',
    bio: '',
    phoneNumber: '',
  });
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await userService.getUser();
      if (response) {
        setFormData({
          email: response.email || '',
          fullName: response.fullName || '',
          dateOfBirth: response.dateOfBirth || '',
          country: response.country || '',
          address: response.address || '',
          bio: response.bio || '',
          phoneNumber: response.phoneNumber || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      await userService.updateProfile(formData);
      Alert.alert('Thành công', 'Đã cập nhật thông tin profile thành công');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Cập nhật thông tin thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <LoadingOverlay visible={loading} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          <ThemedText style={styles.title}>Cập nhật thông tin cá nhân</ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={[styles.input, {
                backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                color: Colors[colorScheme ?? 'light'].text
              }]}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Email"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Họ và tên</ThemedText>
            <TextInput
              style={[styles.input, {
                backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                color: Colors[colorScheme ?? 'light'].text
              }]}
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              placeholder="Họ và tên"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Ngày sinh</ThemedText>
            <TextInput
              style={[styles.input, {
                backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                color: Colors[colorScheme ?? 'light'].text
              }]}
              value={formData.dateOfBirth}
              onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Quốc gia</ThemedText>
            <TextInput
              style={[styles.input, {
                backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                color: Colors[colorScheme ?? 'light'].text
              }]}
              value={formData.country}
              onChangeText={(text) => setFormData({ ...formData, country: text })}
              placeholder="Quốc gia"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Địa chỉ</ThemedText>
            <TextInput
              style={[styles.input, {
                backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                color: Colors[colorScheme ?? 'light'].text
              }]}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Địa chỉ"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Giới thiệu</ThemedText>
            <TextInput
              style={[styles.input, {
                backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                color: Colors[colorScheme ?? 'light'].text,
                height: 100,
                textAlignVertical: 'top',
              }]}
              value={formData.bio}
              onChangeText={(text) => setFormData({ ...formData, bio: text })}
              placeholder="Giới thiệu về bản thân"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Số điện thoại</ThemedText>
            <TextInput
              style={[styles.input, {
                backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                color: Colors[colorScheme ?? 'light'].text
              }]}
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
              placeholder="Số điện thoại"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            <ThemedText style={styles.submitButtonText}>
              {loading ? 'Đang xử lý...' : 'Cập nhật'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
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