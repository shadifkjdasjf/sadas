import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import recipeSlice from './slices/recipeSlice';
import scheduleSlice from './slices/scheduleSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    recipe: recipeSlice,
    schedule: scheduleSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export default store;

