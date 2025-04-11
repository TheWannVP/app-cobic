import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { authService } from '@/services/auth.service';

interface User {
  id: number;
  username: string;
  email?: string | null;
  referralCode?: string;
  referredBy?: number | null;
  isAdmin?: boolean;
  isGuest?: boolean;
  balance?: string;
  nonTransferableBalance?: string;
  lastMiningTime?: string | null;
  lastDailyCheckInTime?: string | null;
  miningRate?: string;
  userMiningRate?: string;
  bonusFactor?: string;
  totalMined?: string;
  fullName?: string | null;
  dateOfBirth?: string | null;
  country?: string | null;
  address?: string | null;
  bio?: string | null;
  phoneNumber?: string | null;
  kycStatus?: string | null;
  kycSubmissionTime?: string | null;
  kycVerificationTime?: string | null;
  kycDocumentFront?: string | null;
  kycDocumentBack?: string | null;
  kycDocumentType?: string | null;
  kycRejectionReason?: string | null;
  plainPassword?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      if (token && userData) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };

  const login = async (token: string, userData: User) => {
    try {
      console.log('AuthContext login - Token:', token);
      
      // Tạo object user để lưu, đảm bảo plainPassword được bao gồm
      const userToSave: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        referralCode: userData.referralCode,
        referredBy: userData.referredBy,
        isAdmin: userData.isAdmin,
        isGuest: userData.isGuest,
        balance: userData.balance,
        nonTransferableBalance: userData.nonTransferableBalance,
        lastMiningTime: userData.lastMiningTime,
        lastDailyCheckInTime: userData.lastDailyCheckInTime,
        miningRate: userData.miningRate,
        userMiningRate: userData.userMiningRate,
        bonusFactor: userData.bonusFactor,
        totalMined: userData.totalMined,
        fullName: userData.fullName,
        dateOfBirth: userData.dateOfBirth,
        country: userData.country,
        address: userData.address,
        bio: userData.bio,
        phoneNumber: userData.phoneNumber,
        kycStatus: userData.kycStatus,
        kycSubmissionTime: userData.kycSubmissionTime,
        kycVerificationTime: userData.kycVerificationTime,
        kycDocumentFront: userData.kycDocumentFront,
        kycDocumentBack: userData.kycDocumentBack,
        kycDocumentType: userData.kycDocumentType,
        kycRejectionReason: userData.kycRejectionReason,
        // Thêm plainPassword nếu có
        ...(userData.plainPassword && { plainPassword: userData.plainPassword })
      };

      console.log('AuthContext login - UserData to save:', JSON.stringify(userToSave, null, 2));
      
      // Lưu token và user data đã xử lý
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userToSave));
      
      // Cập nhật state với user data đã xử lý
      setUser(userToSave);
      setIsAuthenticated(true);
      
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('AuthContext login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('AuthContext: Calling API logout...');
      // Gọi API logout trước
      await authService.logout();
      console.log('AuthContext: API logout successful. Removing items...');
      
      // Sau đó mới xóa token và user
      await AsyncStorage.removeItem('token');
      console.log('AuthContext: Token removed. Removing user...');
      
      await AsyncStorage.removeItem('user');
      console.log('AuthContext: User removed. Updating state...');
      
      setUser(null);
      setIsAuthenticated(false);
      console.log('AuthContext: State updated. Replacing route...');
      
      // Chuyển hướng về trang login và đảm bảo không quay lại
      router.replace({
        pathname: '/login',
        params: { from: 'logout' }
      });
      console.log('AuthContext: Route replaced.');
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
      // Nếu có lỗi, vẫn xóa token và user để đảm bảo đăng xuất
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      router.replace({
        pathname: '/login',
        params: { from: 'logout' }
      });
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, setUser, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}