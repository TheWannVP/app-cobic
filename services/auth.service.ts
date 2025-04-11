import api from './api.client'; // Import API client đã cấu hình

const authService = {
  login: async (username: string, password: string) => {
    try {
      console.log('Attempting login with:', { username, password });
      const response = await api.post('/auth/login', {
        username,
        password
      });
      console.log('Login response:', response.data);
      
      if (!response.data.token) {
        throw new Error('No token in response');
      }
      
      return {
        token: response.data.token,
        user: {
          id: response.data.user.id,
          username: response.data.user.username,
          email: response.data.user.email
        }
      };
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error);
      if (error.response?.status === 401) {
        throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
      }
      throw error;
    }
  },

  register: async (username: string, email: string, password: string) => {
    try {
      console.log('Attempting register with:', { username, email });
      const response = await api.post('/auth/register', { username, email, password });
      console.log('Register response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Register error:', error.response?.data || error);
      throw error;
    }
  },

  getMe: async () => {
    try {
      console.log('Fetching user info');
      const response = await api.get('/auth/me'); // Sử dụng api đã import
      console.log('User info response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('GetMe error:', error.response?.data || error);
      throw error;
    }
  },

  logout: async () => {
    try {
      console.log('Attempting logout');
      const response = await api.post('/auth/logout');
      console.log('Logout response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Logout error:', error.response?.data || error);
      throw error;
    }
  },

  guestRegister: async () => {
    try {
      const response = await api.post('/auth/guest-register');
      console.log('Guest register full response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('Guest register error:', error);
      throw error;
    }
  },
};

export { authService }; 