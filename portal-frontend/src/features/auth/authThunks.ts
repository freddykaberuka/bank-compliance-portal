import { createAsyncThunk } from '@reduxjs/toolkit';
import { LoginCredentials, LoginResponseData } from '../../types/auth';
import apiClient from '../../api';

const TOKEN_STORAGE_KEY = 'bank_portal_auth_token';

export const login = createAsyncThunk<LoginResponseData, LoginCredentials, { rejectValue: string }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);

      return {
        token: response.data.data.token,
        user: response.data.data.user,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    console.log(error,'**');
  } finally {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
});
