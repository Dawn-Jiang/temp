import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserType } from '@/config';

interface UserState {
  token: string | null;
  userId: number | null;
  username: string | null;
  userType: UserType | null;
  realName: string | null;
  setUserInfo: (info: Partial<UserState>) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      username: null,
      userType: null,
      realName: null,
      setUserInfo: (info) => set(info),
      logout: () => set({
        token: null,
        userId: null,
        username: null,
        userType: null,
        realName: null
      })
    }),
    {
      name: 'user-storage'
    }
  )
);
