import type { RootState } from '../../app/store';

export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectAuthRole = (state: RootState) => state.auth.role;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectIsAuthenticated = (state: RootState) => Boolean(state.auth.token);
