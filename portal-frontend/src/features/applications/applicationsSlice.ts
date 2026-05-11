import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../api';

export interface Application {
  id: string;
  institutionName: string;
  licenseType: string;
  state: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  reviewedByUser?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface ApplicationsState {
  applications: Application[];
  loading: boolean;
  createLoading: boolean;
  error: string | null;
  createError: string | null;
}

const initialState: ApplicationsState = {
  applications: [],
  loading: false,
  createLoading: false,
  error: null,
  createError: null,
};

export const fetchApplications = createAsyncThunk(
  'applications/fetchApplications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/applications');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch applications');
    }
  }
);

export const createApplication = createAsyncThunk(
  'applications/createApplication',
  async (
    data: { institutionName: string; licenseType: string; description?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post('/applications', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create application');
    }
  }
);

const applicationsSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.loading = false;
        state.applications = action.payload;
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createApplication.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createApplication.fulfilled, (state, action) => {
        state.createLoading = false;
        state.applications.unshift(action.payload);
      })
      .addCase(createApplication.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload as string;
      });
  },
});

export default applicationsSlice.reducer;