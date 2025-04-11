import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, SafeAreaView, Text } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { userService } from '@/services/user.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const { user, logout, setUser } = useAuth();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  // Kiểm tra token khi component mount
  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login...');
        router.replace('/login');
        setShouldRender(false);
        return;
      }
    };
    checkToken();
  }, []);

  // Chỉ fetch user info khi có token và không đang đăng xuất
  useEffect(() => {
    if (isLoggingOut || !shouldRender) return;
    
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.log('No token during fetch, redirecting to login...');
          router.replace('/login');
          setShouldRender(false);
          return;
        }

        console.log('Fetching user info');
        const userData = await authService.getMe();
        if (!userData) {
          console.log('No user data, redirecting to login...');
          router.replace('/login');
          setShouldRender(false);
          return;
        }
        
        setUser(userData);
        setUserInfo(userData);
      } catch (error) {
        console.error('Error fetching user info:', error);
        router.replace('/login');
        setShouldRender(false);
      }
    };

    fetchUser();
  }, [isLoggingOut, shouldRender]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    console.log('ProfileScreen: Starting logout process...');
    setIsLoggingOut(true);
    setShouldRender(false);
    
    try {
      await logout();
    } catch (error) {
      console.error('ProfileScreen: Error during logout:', error);
      Alert.alert('Lỗi', 'Đăng xuất thất bại. Vui lòng thử lại.');
      setIsLoggingOut(false);
      setShouldRender(true);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa có';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  const getKycStatusText = (status: string | null) => {
    if (!status) return 'Chưa xác thực';
    switch (status) {
      case 'pending': return 'Đang chờ duyệt';
      case 'approved': return 'Đã xác thực';
      case 'rejected': return 'Bị từ chối';
      default: return 'Không xác định';
    }
  };

  const getKycStatusColor = (status: string | null) => {
    if (!status) return Colors.light.icon;
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return Colors.light.icon;
    }
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <LoadingOverlay visible={loading} />
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <IconSymbol name="person.circle.fill" size={80} color={Colors[colorScheme ?? 'light'].tint} />
            </View>
            <ThemedText type="title" style={styles.username}>{userInfo?.username || user?.username}</ThemedText>
            <ThemedText style={styles.accountType}>
              {userInfo?.isGuest ? 'Tài khoản khách' : 'Tài khoản chính thức'}
            </ThemedText>
          </View>

          {/* Account Info */}
          <ThemedView style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>Thông tin tài khoản</ThemedText>
            
            <View style={[styles.infoRow, { borderBottomColor: Colors[colorScheme ?? 'light'].icon + '60' }]}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <ThemedText style={styles.value}>{userInfo?.email || 'Chưa cập nhật'}</ThemedText>
            </View>

            <View style={[styles.infoRow, { borderBottomColor: Colors[colorScheme ?? 'light'].icon + '60' }]}>
              <ThemedText style={styles.label}>Số dư</ThemedText>
              <ThemedText style={styles.value}>{userInfo?.balance || '0'}</ThemedText>
            </View>

            <View style={[styles.infoRow, { borderBottomColor: Colors[colorScheme ?? 'light'].icon + '60' }]}>
              <ThemedText style={styles.label}>Số dư không thể chuyển</ThemedText>
              <ThemedText style={styles.value}>{userInfo?.nonTransferableBalance || '0'}</ThemedText>
            </View>

            <View style={[styles.infoRow, { borderBottomColor: Colors[colorScheme ?? 'light'].icon + '60' }]}>
              <ThemedText style={styles.label}>Tốc độ đào</ThemedText>
              <ThemedText style={styles.value}>{userInfo?.miningRate || '0'}/phút</ThemedText>
            </View>

            <View style={[styles.infoRow, { borderBottomColor: Colors[colorScheme ?? 'light'].icon + '60' }]}>
              <ThemedText style={styles.label}>Lần đào gần nhất</ThemedText>
              <ThemedText style={styles.value}>{formatDate(userInfo?.lastMiningTime)}</ThemedText>
            </View>

            <View style={[styles.infoRow, { borderBottomColor: Colors[colorScheme ?? 'light'].icon + '60' }]}>
              <ThemedText style={styles.label}>Mã giới thiệu</ThemedText>
              <ThemedText style={styles.value}>{userInfo?.referralCode || 'Chưa có'}</ThemedText>
            </View>

            <View style={[styles.infoRow, { borderBottomColor: Colors[colorScheme ?? 'light'].icon + '60' }]}>
              <ThemedText style={styles.label}>Được giới thiệu bởi</ThemedText>
              <ThemedText style={styles.value}>{userInfo?.referredBy || 'Không có'}</ThemedText>
            </View>

            <View style={styles.infoRowNoBorder}>
              <ThemedText style={styles.label}>Trạng thái xác thực</ThemedText>
              <ThemedText style={[
                styles.value,
                { color: getKycStatusColor(userInfo?.kycStatus) }
              ]}>
                {getKycStatusText(userInfo?.kycStatus)}
              </ThemedText>
            </View>
          </ThemedView>

          {/* Actions / Settings Menu */}
          <ThemedView style={styles.actions}>
            <ThemedText type="title" style={styles.sectionTitle}>Cài đặt & Hành động</ThemedText>

            {/* Mục điều hướng Đổi mật khẩu */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: Colors[colorScheme ?? 'light'].icon + '60' }]}
              onPress={() => router.push('/(tabs)/profile/change-password')}
            >
              <View style={styles.menuItemContent}>
                <IconSymbol name="lock.rectangle.stack.fill" size={20} color={Colors[colorScheme ?? 'light'].text} />
                <ThemedText style={styles.menuItemText}>Đổi mật khẩu</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={Colors[colorScheme ?? 'light'].icon} />
            </TouchableOpacity>

            {/* Mục điều hướng Đổi tên đăng nhập */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: Colors[colorScheme ?? 'light'].icon + '60' }]}
              onPress={() => router.push('/(tabs)/profile/username')}
            >
              <View style={styles.menuItemContent}>
                <IconSymbol name="person.crop.circle.fill" size={20} color={Colors[colorScheme ?? 'light'].text} />
                <ThemedText style={styles.menuItemText}>Đổi tên đăng nhập</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={Colors[colorScheme ?? 'light'].icon} />
            </TouchableOpacity>

            {/* Mục điều hướng Cập nhật thông tin */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: Colors[colorScheme ?? 'light'].icon + '60' }]}
              onPress={() => router.push('/(tabs)/profile/profile')}
            >
              <View style={styles.menuItemContent}>
                <IconSymbol name="person.text.rectangle.fill" size={20} color={Colors[colorScheme ?? 'light'].text} />
                <ThemedText style={styles.menuItemText}>Cập nhật thông tin</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={Colors[colorScheme ?? 'light'].icon} />
            </TouchableOpacity>

            {/* Nút Đăng xuất */}
            <TouchableOpacity 
              style={[styles.logoutButton, loading && styles.buttonDisabled]}
              onPress={handleLogout}
              disabled={loading} 
            >
              <ThemedText style={styles.logoutButtonText}>Đăng xuất</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 96,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    marginBottom: 4,
  },
  accountType: {
    fontSize: 14,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoRowNoBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    marginTop: 24,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#FCA5A5',
  },
}); 