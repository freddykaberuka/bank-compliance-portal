import { createSlice } from '@reduxjs/toolkit';
import type { AuthState } from '../../types/auth';
import { login, logout } from './authThunks';

const TOKEN_STORAGE_KEY = 'bank_portal_auth_token';

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

const saveToken = (token: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

const initialState: AuthState = {
  token: getStoredToken(),
  user: null,
  role: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.role = action.payload.user.role;
        state.error = null;
        saveToken(action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? action.error.message ?? 'Login failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.role = null;
        state.loading = false;
        state.error = null;
        saveToken(null);
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
