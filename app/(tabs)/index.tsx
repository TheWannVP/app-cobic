import React from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, Image, Animated, TouchableOpacity, Alert, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Svg, { Circle, Path } from 'react-native-svg';
import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { systemService } from '@/services/system.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { Logo } from '@/components/ui/Logo';
import { useColorScheme } from '@/hooks/useColorScheme';
import { miningService, DailyCheckInResult, DailyCheckInError } from '@/services/mining.service';
import { useFocusEffect } from '@react-navigation/native';

// Định nghĩa kiểu dữ liệu cho stats
interface SystemStats {
  globalMiningRate: string;
  decayFactor: string;
  lastDecayDate: string;
  totalSupply: string;
  currentSupply: string;
  userCount: number;
  lastDecayUserCount: number;
}

interface MiningStatus {
  nextMiningTime: string;
}

export default function HomeScreen() {
  const { isAuthenticated, user, logout, login, setIsAuthenticated, setUser } = useAuth();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null); // State cho system stats
  const [statsLoading, setStatsLoading] = useState(false); // State loading riêng cho stats
  const spinValue = useRef(new Animated.Value(0)).current;
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const colorScheme = useColorScheme();
  const [miningStatus, setMiningStatus] = useState<MiningStatus | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isFetching, setIsFetching] = useState(false);
  const [hasFetchedWhenZero, setHasFetchedWhenZero] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserInfo();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await systemService.getPublicStats();
        console.log('System stats:', stats); // Thêm log để debug
        setSystemStats(stats);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMiningStatus();
    }
  }, [isAuthenticated]);

  // Thêm useFocusEffect để fetch mining status khi focus vào tab
  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) {
        fetchMiningStatus();
      }
    }, [isAuthenticated])
  );

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const response = await authService.getMe();
      setUserInfo(response);
    } catch (error) {
      console.error('Error fetching user info:', error);
      if ((error as any).response?.status === 401) {
        await logout();
        Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'Chưa có';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDailyCheckIn = async () => {
    try {
      setLoading(true);
      const result = await miningService.checkIn();
      Alert.alert(
        'Thành công',
        `${result.message}\n\nNhận được: ${result.reward} COBIC\nSố dư mới: ${result.newBalance} COBIC`,
        [
          {
            text: 'OK',
            onPress: async () => {
              await fetchMiningStatus(); // Cập nhật lại trạng thái mining
              await fetchUserInfo(); // Cập nhật lại thông tin người dùng và số dư
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Check-in error:', error);
      console.error('Check-in error response:', error.response?.data);
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            const errorData = error.response.data as DailyCheckInError;
            Alert.alert(
              'Không thể điểm danh', 
              `Điểm danh thất bại vì đã điểm danh trong 24 giờ qua.\nCòn ${errorData.remainingHours} giờ nữa có thể điểm danh lại.`
            );
            break;
          case 401:
            Alert.alert(
              'Không được xác thực', 
              'Vui lòng đăng nhập lại để tiếp tục.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    logout();
                  }
                }
              ]
            );
            break;
          case 500:
            Alert.alert(
              'Lỗi máy chủ', 
              'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
            );
            break;
          default:
            Alert.alert('Lỗi', error.response?.data?.message || 'Điểm danh thất bại. Vui lòng thử lại.');
        }
      } else {
        Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Lỗi', 'Đăng xuất thất bại. Vui lòng thử lại.');
    }
  };

  const handleGuestRegister = async () => {
    try {
      setLoading(true);
      const response = await authService.guestRegister();
      console.log('Guest register response (home page):', JSON.stringify(response, null, 2));
      
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
              setShowUpdateForm(true);
              setNewUsername(response.user.username);
            }
          },
          { 
            text: 'OK',
            onPress: async () => {
              await login(response.token, {
                ...response.user,
                plainPassword: response.user.plainPassword 
              });
              setShowUpdateForm(true);
              setNewUsername(response.user.username);
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Guest register error (home page):', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccount = async () => {
    if (!newUsername.trim() || !newPassword || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
      return;
    }

    const currentPassword = user?.plainPassword;
    if (!currentPassword) {
      Alert.alert('Lỗi', 'Không tìm thấy mật khẩu hiện tại để thực hiện thay đổi.');
      return;
    }

    try {
      setUpdateLoading(true);
      if (newUsername.trim() !== user?.username) {
        await userService.updateUsername(newUsername.trim());
      }
      await userService.changePassword(currentPassword, newPassword);
      Alert.alert('Thành công', 'Cập nhật thông tin tài khoản thành công');
      setShowUpdateForm(false);
      fetchUserInfo();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setUpdateLoading(false);
    }
  };

  const fetchMiningStatus = async () => {
    if (isFetching) return;
    setIsFetching(true);
    try {
      const status = await miningService.getMiningStatus();
      setMiningStatus(status);
      if (status.nextMiningTime) {
        const now = new Date();
        const nextTime = new Date(status.nextMiningTime);
        const diff = nextTime.getTime() - now.getTime();
        if (diff > 0) {
          setTimeLeft(formatTimeLeft(diff));
        } else {
          setTimeLeft('');
        }
      }
    } catch (error) {
      console.error('Error fetching mining status:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const formatTimeLeft = (diff: number) => {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timeLeft) {
      interval = setInterval(() => {
        const now = new Date();
        const nextTime = new Date(miningStatus?.nextMiningTime || '');
        const diff = nextTime.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeLeft('');
          clearInterval(interval);
        } else {
          setTimeLeft(formatTimeLeft(diff));
        }
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timeLeft, miningStatus?.nextMiningTime]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.container}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.logoContainer}>
                <Animated.View style={[styles.logoWrapper, { transform: [{ rotate: spin }] }]}>
                  <Logo />
                </Animated.View>
                <ThemedText type="title" style={[styles.title, { color: Colors[colorScheme ?? 'light'].tint }]}>Cobic</ThemedText>
              </View>
              <ThemedText style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].icon }]}>Hệ Thống Quản Lý Chuỗi Cà Phê</ThemedText>
            </View>
          </View>

          {/* Daily Check-in */}
          <ThemedView style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="title" style={styles.sectionTitle}>
                {isAuthenticated ? 'Thông tin cá nhân' : 'Đăng nhập hằng ngày'}
              </ThemedText>
              {isAuthenticated && (
                <TouchableOpacity onPress={handleLogout}>
                  <ThemedText style={[styles.logoutButton, { color: Colors[colorScheme ?? 'light'].tint }]}>Đăng xuất</ThemedText>
                </TouchableOpacity>
              )}
            </View>
            
            {isAuthenticated ? (
              <View style={styles.userInfoContainer}> 
                {/* Phần chào */}
                <ThemedText style={styles.userName}>Xin chào, {userInfo?.username || user?.username}</ThemedText>
                <ThemedText style={styles.userEmail}>{userInfo?.email || 'Chưa cập nhật email'}</ThemedText>

                {/* Số dư nổi bật */}
                <View style={styles.balanceContainer}>
                  <IconSymbol name="creditcard.fill" size={24} color={Colors[colorScheme ?? 'light'].tint} />
                  <View style={styles.balanceTextContainer}>
                    <ThemedText style={styles.balanceLabel}>Số dư chính</ThemedText>
                    <ThemedText style={styles.balanceValue}>{userInfo?.balance || '0.00'}</ThemedText>
                  </View>
                </View>

                {/* Thông tin phụ (hàng ngang) */}
                <View style={styles.secondaryInfoContainer}>
                  {/* Tốc độ đào */}
                  <View style={styles.secondaryInfoItem}>
                    <IconSymbol name="bolt.fill" size={18} color={Colors[colorScheme ?? 'light'].icon} />
                    <View>
                      <ThemedText style={styles.secondaryInfoLabel}>Tốc độ</ThemedText>
                      <ThemedText style={styles.secondaryInfoValue}>{userInfo?.miningRate || '0'}/giờ</ThemedText>
                    </View>
                  </View>

                  {/* Đường kẻ phân cách */}
                  <View style={[styles.verticalDivider, { backgroundColor: Colors[colorScheme ?? 'light'].icon + '40' }]} />
                  
                  {/* Mã giới thiệu */}
                  <View style={styles.secondaryInfoItem}>
                     <IconSymbol name="person.2.fill" size={18} color={Colors[colorScheme ?? 'light'].icon} />
                     <View style={styles.referralValueContainer}> 
                       <ThemedText style={styles.secondaryInfoLabel}>Mã mời</ThemedText>
                       <View style={styles.referralCodeInnerBox}> 
                         <ThemedText style={styles.secondaryInfoValue} numberOfLines={1} ellipsizeMode='tail'>
                           {userInfo?.referralCode || 'N/A'}
                         </ThemedText>
                         {userInfo?.referralCode && (
                           <TouchableOpacity onPress={async () => {
                             await Clipboard.setStringAsync(userInfo.referralCode);
                             Alert.alert('Đã sao chép');
                           }} style={styles.copyButtonSmall}>
                              <IconSymbol name="doc.on.doc" size={14} color={Colors[colorScheme ?? 'light'].tint} />
                           </TouchableOpacity>
                         )}
                       </View>
                     </View>
                  </View>
                </View>
                
                {/* Nút Check-in */}
                <TouchableOpacity 
                  style={[
                    styles.checkInButtonFullWidth, 
                    (loading || timeLeft) && styles.checkInButtonDisabled
                  ]}
                  onPress={handleDailyCheckIn}
                  disabled={loading || !!timeLeft}
                >
                  <ThemedText style={styles.checkInButtonText}>
                    {loading ? 'Đang xử lý...' : timeLeft ? `Còn ${timeLeft}` : 'Điểm danh hàng ngày'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.guestActions}>
                <TouchableOpacity 
                  style={styles.loginButton}
                  onPress={() => router.push('/login')}
                >
                  <ThemedText style={styles.loginButtonText}>Đăng nhập</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.guestRegisterButton}
                  onPress={handleGuestRegister}
                  disabled={loading}
                >
                  <ThemedText style={styles.guestRegisterButtonText}>
                    {loading ? 'Đang xử lý...' : 'Đăng ký nhanh'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </ThemedView>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <ThemedView style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }]}>
                <IconSymbol name="mug.fill" size={24} color={Colors[colorScheme ?? 'light'].tint} />
              </View>
              <View style={styles.statContent}>
                <ThemedText style={styles.statLabel}>Quán Đã Ghé</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.statValue}>12</ThemedText>
              </View>
            </ThemedView>
            <ThemedView style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }]}>
                <IconSymbol name="star.fill" size={24} color={Colors[colorScheme ?? 'light'].tint} />
              </View>
              <View style={styles.statContent}>
                <ThemedText style={styles.statLabel}>Điểm Tích Lũy</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.statValue}>1,250</ThemedText>
              </View>
            </ThemedView>
          </View>

          {/* System Stats Section */} 
          <ThemedView style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>Thống kê hệ thống</ThemedText>
            {statsLoading ? (
              <ThemedText style={styles.loadingText}>Đang tải thống kê...</ThemedText>
            ) : systemStats ? (
              <View>
                <View style={[styles.statRow, { borderBottomColor: Colors[colorScheme ?? 'light'].icon + '60' }]} >
                  <ThemedText style={styles.statLabel}>Tổng cung tối đa</ThemedText>
                  <ThemedText style={styles.statValue}>
                    {systemStats.totalSupply === 'string' ? 'Đang cập nhật' : `${systemStats.totalSupply} COBIC`}
                  </ThemedText>
                </View>
                <View style={[styles.statRow, { borderBottomColor: Colors[colorScheme ?? 'light'].icon + '60' }]} >
                  <ThemedText style={styles.statLabel}>Tổng cung hiện tại</ThemedText>
                  <ThemedText style={styles.statValue}>
                    {systemStats.currentSupply === 'string' ? 'Đang cập nhật' : `${systemStats.currentSupply} COBIC`}
                  </ThemedText>
                </View>
                <View style={[styles.statRow, { borderBottomColor: Colors[colorScheme ?? 'light'].icon + '60' }]} >
                  <ThemedText style={styles.statLabel}>Tốc độ đào cơ bản</ThemedText>
                  <ThemedText style={styles.statValue}>
                    {systemStats.globalMiningRate === 'string' ? 'Đang cập nhật' : `${systemStats.globalMiningRate} COBIC/giờ`}
                  </ThemedText>
                </View>
                <View style={[styles.statRow, { borderBottomColor: Colors[colorScheme ?? 'light'].icon + '60' }]} >
                  <ThemedText style={styles.statLabel}>Hệ số phân rã</ThemedText>
                  <ThemedText style={styles.statValue}>
                    {systemStats.decayFactor === 'string' ? 'Đang cập nhật' : systemStats.decayFactor}
                  </ThemedText>
                </View>
                <View style={[styles.statRow, { borderBottomColor: Colors[colorScheme ?? 'light'].icon + '60' }]} >
                  <ThemedText style={styles.statLabel}>Lần phân rã cuối</ThemedText>
                  <ThemedText style={styles.statValue}>
                    {systemStats.lastDecayDate ? formatTime(systemStats.lastDecayDate) : 'Chưa có'}
                  </ThemedText>
                </View>
                <View style={[styles.statRow, { borderBottomColor: Colors[colorScheme ?? 'light'].icon + '60' }]} >
                  <ThemedText style={styles.statLabel}>Số người dùng lần phân rã cuối</ThemedText>
                  <ThemedText style={styles.statValue}>
                    {systemStats.lastDecayUserCount}
                  </ThemedText>
                </View>
                <View style={[styles.statRow, { borderBottomWidth: 0 }]} >
                  <ThemedText style={styles.statLabel}>Tổng số người dùng</ThemedText>
                  <ThemedText style={styles.statValue}>
                    {systemStats.userCount}
                  </ThemedText>
                </View>
              </View>
            ) : (
              <ThemedText style={styles.errorText}>Không thể tải thống kê.</ThemedText>
            )}
          </ThemedView>

          {/* Update Account Form */}
          {showUpdateForm && isAuthenticated && (
            <ThemedView style={styles.section}>
              <ThemedText type="title" style={styles.sectionTitle}>Cập nhật thông tin tài khoản</ThemedText>
              <ThemedText style={styles.warningText}>
                Vui lòng cập nhật thông tin tài khoản để tránh quên mật khẩu
              </ThemedText>
              <TextInput
                style={[styles.input, {
                  backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                  borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                  color: Colors[colorScheme ?? 'light'].text
                }]}
                value={newUsername}
                onChangeText={setNewUsername}
                placeholder="Tên đăng nhập mới (tùy chọn)"
                placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              />
              <TextInput
                style={[styles.input, {
                  backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                  borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                  color: Colors[colorScheme ?? 'light'].text
                }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Mật khẩu mới"
                placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
                secureTextEntry
              />
              <TextInput
                style={[styles.input, {
                  backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                  borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                  color: Colors[colorScheme ?? 'light'].text
                }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Xác nhận mật khẩu mới"
                placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
                secureTextEntry
              />
              <TouchableOpacity 
                style={[styles.button, updateLoading && styles.buttonDisabled]}
                onPress={handleUpdateAccount}
                disabled={updateLoading || !newPassword || newPassword !== confirmPassword}
              >
                <ThemedText style={styles.buttonText}>
                  {updateLoading ? 'Đang xử lý...' : 'Cập nhật'}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}

          {/* Partner Cafes */}
          <ThemedView style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>Quán cà phê đối tác</ThemedText>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.cafeScroll}
            >
              <View style={[styles.cafeCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]} >
                <View style={[styles.cafeImage, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }]}>
                  <IconSymbol name="mug.fill" size={40} color={Colors[colorScheme ?? 'light'].tint} />
                </View>
                <View style={styles.cafeInfo}>
                  <ThemedText style={styles.cafeName}>The Coffee House</ThemedText>
                  <ThemedText style={[styles.cafeAddress, { color: Colors[colorScheme ?? 'light'].icon }]}>123 Đường ABC, Quận 1</ThemedText>
                  <View style={styles.cafeRating}>
                    <IconSymbol name="star.fill" size={16} color="#FFD700" />
                    <ThemedText style={[styles.ratingText, { color: Colors[colorScheme ?? 'light'].icon }]}>4.8</ThemedText>
                  </View>
                </View>
              </View>
              <View style={[styles.cafeCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]} >
                <View style={[styles.cafeImage, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }]}>
                  <IconSymbol name="cup.and.saucer.fill" size={40} color={Colors[colorScheme ?? 'light'].tint} />
                </View>
                <View style={styles.cafeInfo}>
                  <ThemedText style={styles.cafeName}>Highlands Coffee</ThemedText>
                  <ThemedText style={[styles.cafeAddress, { color: Colors[colorScheme ?? 'light'].icon }]}>456 Đường XYZ, Quận 3</ThemedText>
                  <View style={styles.cafeRating}>
                    <IconSymbol name="star.fill" size={16} color="#FFD700" />
                    <ThemedText style={[styles.ratingText, { color: Colors[colorScheme ?? 'light'].icon }]}>4.5</ThemedText>
                  </View>
                </View>
              </View>
            </ScrollView>
          </ThemedView>

          {/* Recent Activities */}
          <ThemedView style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>Hoạt động gần đây</ThemedText>
            <View style={[styles.activityCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]} >
              <ThemedText style={styles.emptyText}>Chưa có hoạt động nào</ThemedText>
            </View>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingTop: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoWrapper: {
    marginRight: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    fontWeight: '500',
  },
  userInfoContainer: {
    padding: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 24,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  balanceTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  secondaryInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 12,
  },
  secondaryInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  secondaryInfoLabel: {
    fontSize: 13,
    marginLeft: 8,
    opacity: 0.8,
  },
  secondaryInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  verticalDivider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
    alignSelf: 'center',
    marginHorizontal: 8,
  },
  referralValueContainer: {
    marginLeft: 8,
    flex: 1,
  },
  referralCodeInnerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  secondaryInfoValueReferral: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  copyButtonSmall: {
    marginLeft: 8,
    padding: 2,
  },
  checkInButtonFullWidth: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  checkInButtonDisabled: {
  },
  checkInButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  guestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  loginButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  guestRegisterButton: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  guestRegisterButtonText: {
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  statIcon: {
    padding: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#EDE9FE',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    color: 'orange',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  cafeScroll: {
    marginTop: 8,
  },
  cafeCard: {
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
    width: 250,
  },
  cafeImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cafeInfo: {},
  cafeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cafeAddress: {
    fontSize: 13,
    marginBottom: 8,
  },
  cafeRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '500',
  },
  activityCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.light.icon,
    fontSize: 14,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  loadingText: {
    textAlign: 'center',
    paddingVertical: 16,
    color: Colors.light.icon,
  },
  errorText: {
    textAlign: 'center',
    paddingVertical: 16,
    color: '#EF4444',
  },
});
