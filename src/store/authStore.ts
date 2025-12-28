import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';
import { getUserByPhone, createUser } from '../db/database';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingPhone: string | null;

  setUser: (user: User | null) => void;
  setPendingPhone: (phone: string) => void;
  verifyOtp: (otp: string, name?: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      pendingPhone: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setPendingPhone: (phone) => set({ pendingPhone: phone }),

      verifyOtp: async (otp: string, name?: string) => {
        const { pendingPhone } = get();
        if (!pendingPhone) return false;

        // Mock OTP verification - accepts any 6-digit code
        if (otp.length !== 6 || !/^\d+$/.test(otp)) {
          return false;
        }

        set({ isLoading: true });

        try {
          // Check if user exists
          let user = await getUserByPhone(pendingPhone);

          if (!user && name) {
            // Create new user
            user = await createUser(pendingPhone, name);
          } else if (!user) {
            set({ isLoading: false });
            return false;
          }

          set({ user, isAuthenticated: true, isLoading: false, pendingPhone: null });
          return true;
        } catch (error) {
          console.error('Auth error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => set({ user: null, isAuthenticated: false, pendingPhone: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
