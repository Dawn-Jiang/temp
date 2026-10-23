import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { authApi } from '@/api/auth';
import type { RegisterParams } from '@/api/auth';

export const useAuth = () => {
  const navigate = useNavigate();
  const { setUserInfo, logout } = useUserStore();

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await authApi.login({ username, password });
      localStorage.setItem('token', result.token);
      setUserInfo({
        token: result.token,
        userId: result.userId,
        username: result.username,
        userType: result.userType,
        realName: result.realName
      });
      return result;
    },
    [setUserInfo]
  );

  const register = useCallback(async (data: RegisterParams) => {
    await authApi.register(data);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    logout();
    navigate('/login');
  }, [logout, navigate]);

  return {
    login,
    register,
    logout: handleLogout
  };
};

export default useAuth;
