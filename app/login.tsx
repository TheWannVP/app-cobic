import { StyleSheet, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import Svg, { Circle, Path } from 'react-native-svg';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useColorScheme } from '@/hooks/useColorScheme';

const Logo = ({ color }: { color: string }) => (
  <Svg width={80} height={80} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="1"/>
    <Path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/>
    <Path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/>
  </Svg>
);

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.login(username, password);
      console.log('Login response:', response);
      
      await login(response.token, response.user);
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestRegister = async () => {
    setLoading(true);
    try {
      const response = await authService.guestRegister();
      console.log('Guest register response (login page):', JSON.stringify(response, null, 2));

      Alert.alert(
        'Thông tin tài khoản',
        `Tên đăng nhập: ${response.user.username}\nMật khẩu: ${response.user.plainPassword}\n\nVui lòng ghi nhớ thông tin này để đăng nhập lại sau!`,
        [
          { 
            text: 'Sao chép Mật khẩu',
            onPress: async () => {
              await Clipboard.setStringAsync(response.user.plainPassword);
              Alert.alert('Đã sao chép', 'Mật khẩu đã được sao chép vào bộ nhớ tạm.');
              await login(response.token, {
                ...response.user,
                plainPassword: response.user.plainPassword 
              });
            }
          },
          { 
            text: 'OK',
            onPress: async () => {
              await login(response.token, {
                ...response.user,
                plainPassword: response.user.plainPassword 
              });
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Guest register error (login page):', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Đăng ký nhanh thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return null;
  }

  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const iconColor = Colors[colorScheme ?? 'light'].icon;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const inputBackgroundColor = Colors[colorScheme ?? 'light'].inputBackground;
  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const disabledButtonBackgroundColor = colorScheme === 'dark' ? '#252728' : '#EDE9FE';

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.content}>
        <View style={styles.logoContainer}>
          <Logo color={tintColor} />
          <ThemedText type="title" style={[styles.title, { color: tintColor }]}>Cobic</ThemedText>
          <ThemedText style={[styles.subtitle, { color: iconColor }]}>Hệ Thống Quản Lý Chuỗi Cà Phê</ThemedText>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <ThemedText style={[styles.label, { color: iconColor }]}>Tên đăng nhập</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBackgroundColor, color: textColor, borderColor: iconColor + '40' }]}
              placeholder="Nhập tên đăng nhập"
              placeholderTextColor={iconColor}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={[styles.label, { color: iconColor }]}>Mật khẩu</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBackgroundColor, color: textColor, borderColor: iconColor + '40' }]}
              placeholder="Nhập mật khẩu"
              placeholderTextColor={iconColor}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <ThemedText style={[styles.forgotPasswordText, { color: tintColor }]}>Quên mật khẩu?</ThemedText>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <TouchableOpacity 
              style={[styles.loginButton, { backgroundColor: tintColor }, (!username || !password || loading) && [styles.loginButtonDisabled, { backgroundColor: disabledButtonBackgroundColor }]]}
              onPress={handleLogin}
              disabled={!username || !password || loading}
            >
              <ThemedText style={styles.loginButtonText}>
                {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
              </ThemedText>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: iconColor }]} />
              <ThemedText style={[styles.dividerText, { color: iconColor }]}>hoặc</ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: iconColor }]} />
            </View>

            <TouchableOpacity 
              style={[
                styles.guestButton, 
                { backgroundColor: tintColor }, 
                loading && [styles.guestButtonDisabled, { backgroundColor: disabledButtonBackgroundColor }]
              ]}
              onPress={handleGuestRegister}
              disabled={loading}
            >
              <ThemedText style={styles.guestButtonText}>
                {loading ? 'Đang xử lý...' : 'Đăng ký nhanh'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: iconColor }]}>Chưa có tài khoản? </ThemedText>
          <TouchableOpacity onPress={() => router.replace('/register')}>
            <ThemedText style={[styles.footerLink, { color: tintColor }]}>Đăng ký ngay</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  loginContainer: {
    marginVertical: 16,
  },
  loginButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  loginButtonDisabled: {
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    opacity: 0.4,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
  },
  guestButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  guestButtonDisabled: {
  },
  guestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 