import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function ProfileLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { 
          backgroundColor: Colors[colorScheme ?? 'light'].background 
        },
        headerTintColor: Colors[colorScheme ?? 'light'].text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Thông tin cá nhân',
        }}
      />
      <Stack.Screen
        name="change-password"
        options={{
          title: 'Đổi mật khẩu',
        }}
      />
      <Stack.Screen
        name="username"
        options={{
          title: 'Đổi tên đăng nhập',
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: 'Cập nhật thông tin',
        }}
      />
    </Stack>
  );
} 