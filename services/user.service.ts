import api from './api.client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

let isHandlingUnauthorized = false;

const handleUnauthorized = async () => {
  if (isHandlingUnauthorized) return null;
  
  try {
    isHandlingUnauthorized = true;
    // Chuyển về màn hình đăng nhập
    router.replace('/login');
    return null;
  } finally {
    isHandlingUnauthorized = false;
  }
};

const userService = {
  updateUsername: async (username: string) => {
    try {
      const response = await api.patch('/user/username', { username });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return handleUnauthorized();
      }
      console.error('Error updating username:', error);
      throw error;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      console.log('Changing password...');
      const response = await api.post('/user/change-password', {
        currentPassword,
        newPassword
      });
      console.log('Change password response:', response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return handleUnauthorized();
      }
      console.error('Error changing password:', error.response?.data || error);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  getUser: async () => {
    try {
      console.log('Fetching user info from /user');
      const token = await AsyncStorage.getItem('token');
      console.log('Token before request:', token);
      
      if (!token) {
        return handleUnauthorized();
      }
      
      const response = await api.get('/user');
      console.log('User info response:', response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return handleUnauthorized();
      }
      console.error('GetUser error:', error.response?.data || error);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  updateProfile: async (profileData: {
    email?: string;
    fullName?: string;
    dateOfBirth?: string;
    country?: string;
    address?: string;
    bio?: string;
    phoneNumber?: string;
  }) => {
    try {
      console.log('Updating profile...');
      const response = await api.patch('/user/profile', profileData);
      console.log('Update profile response:', response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return handleUnauthorized();
      }
      console.error('Error updating profile:', error.response?.data || error);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },
};

export { userService }; 