import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://cobic.io/api'; // Giữ nguyên API URL

// Tạo instance Axios tập trung
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor để tự động thêm token vào header
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    console.log('Interceptor - Current token:', token);
    console.log('Interceptor - Request URL:', config.url);
    
    if (token) {
      // Kiểm tra xem token đã có Bearer chưa
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = formattedToken;
      console.log('Interceptor - Updated headers:', config.headers);
    }
    return config;
  } catch (error) {
    console.error('Interceptor error:', error);
    // Trong trường hợp lỗi interceptor, vẫn nên trả về config để yêu cầu có thể tiếp tục (dù có thể thiếu token)
    // Hoặc bạn có thể chọn throw lỗi ở đây nếu muốn dừng yêu cầu
    return config; 
  }
});

// Export instance đã cấu hình
export default api; 