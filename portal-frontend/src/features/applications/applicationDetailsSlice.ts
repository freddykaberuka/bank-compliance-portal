import { createAction, createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../api';

export interface ApplicationDetails {
  id: string;
  institutionName: string;
  licenseType: string;
  description: string | null;
  state: string;
  version: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  reviewedBy?: {
    id: string;
    name: string;
  } | null;
  approvedBy?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDocument {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  version: number;
  uploadedBy: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  createdAt: string;
}

export const setUploadProgress = createAction<number>('applicationDetails/setUploadProgress');

interface ApplicationDetailsState {
  application: ApplicationDetails | null;
  documents: ApplicationDocument[];
  loading: boolean;
  documentsLoading: boolean;
  uploading: boolean;
  actionLoading: boolean;
  error: string | null;
  uploadError: string | null;
  uploadProgress: number;
}

const initialState: ApplicationDetailsState = {
  application: null,
  documents: [],
  loading: false,
  documentsLoading: false,
  uploading: false,
  actionLoading: false,
  error: null,
  uploadError: null,
  uploadProgress: 0,
};

export const fetchApplicationDetails = createAsyncThunk<
  ApplicationDetails,
  string,
  { rejectValue: string }
>('applicationDetails/fetchApplicationDetails', async (applicationId, { rejectWithValue }) => {
  try {
    const response = await apiClient.get(`/applications/${applicationId}`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to load application details');
  }
});

export const fetchApplicationDocuments = createAsyncThunk<
  ApplicationDocument[],
  string,
  { rejectValue: string }
>('applicationDetails/fetchApplicationDocuments', async (applicationId, { rejectWithValue }) => {
  try {
    const response = await apiClient.get(`/applications/${applicationId}/documents`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to load documents');
  }
});

export const uploadApplicationDocument = createAsyncThunk<
  ApplicationDocument,
  { applicationId: string; file: File },
  { rejectValue: string }
>('applicationDetails/uploadApplicationDocument', async ({ applicationId, file }, { rejectWithValue, dispatch }) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`/applications/${applicationId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (event) => {
        if (event.total) {
          const progress = Math.round((event.loaded / event.total) * 100);
          dispatch(setUploadProgress(progress));
        }
      },
    });
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to upload document');
  }
});

const actionEndpointMap: Record<string, string> = {
  submit: 'submit',
  review: 'review',
  requestMoreInfo: 'request-more-info',
  approve: 'approve',
  reject: 'reject',
};

export const performApplicationAction = createAsyncThunk<
  ApplicationDetails,
  { applicationId: string; action: keyof typeof actionEndpointMap },
  { rejectValue: string }
>(
  'applicationDetails/performApplicationAction',
  async ({ applicationId, action }, { rejectWithValue }) => {
    try {
      const endpoint = actionEndpointMap[action];
      const response = await apiClient.post(`/applications/${applicationId}/${endpoint}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to perform action');
    }
  }
);

const applicationDetailsSlice = createSlice({
  name: 'applicationDetails',
  initialState,
  reducers: {
    resetApplicationDetails(state) {
      state.application = null;
      state.documents = [];
      state.loading = false;
      state.documentsLoading = false;
      state.uploading = false;
      state.actionLoading = false;
      state.error = null;
      state.uploadError = null;
      state.uploadProgress = 0;
    },
    clearUploadError(state) {
      state.uploadError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplicationDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApplicationDetails.fulfilled, (state, action: PayloadAction<ApplicationDetails>) => {
        state.loading = false;
        state.application = action.payload;
      })
      .addCase(fetchApplicationDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchApplicationDocuments.pending, (state) => {
        state.documentsLoading = true;
      })
      .addCase(fetchApplicationDocuments.fulfilled, (state, action: PayloadAction<ApplicationDocument[]>) => {
        state.documentsLoading = false;
        state.documents = action.payload;
      })
      .addCase(fetchApplicationDocuments.rejected, (state, action) => {
        state.documentsLoading = false;
        state.error = action.payload as string;
      })
      .addCase(setUploadProgress, (state, action: PayloadAction<number>) => {
        state.uploadProgress = action.payload;
      })
      .addCase(uploadApplicationDocument.pending, (state) => {
        state.uploading = true;
        state.uploadError = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadApplicationDocument.fulfilled, (state, action: PayloadAction<ApplicationDocument>) => {
        state.uploading = false;
        state.uploadProgress = 100;
        state.documents.unshift(action.payload);
      })
      .addCase(uploadApplicationDocument.rejected, (state, action) => {
        state.uploading = false;
        state.uploadError = action.payload as string;
        state.uploadProgress = 0;
      })
      .addCase(performApplicationAction.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(performApplicationAction.fulfilled, (state, action: PayloadAction<ApplicationDetails>) => {
        state.actionLoading = false;
        state.application = action.payload;
      })
      .addCase(performApplicationAction.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetApplicationDetails, clearUploadError } = applicationDetailsSlice.actions;
export default applicationDetailsSlice.reducer;
