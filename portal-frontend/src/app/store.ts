import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import applicationsReducer from '../features/applications/applicationsSlice';
import applicationDetailsReducer from '../features/applications/applicationDetailsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    applications: applicationsReducer,
    applicationDetails: applicationDetailsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
