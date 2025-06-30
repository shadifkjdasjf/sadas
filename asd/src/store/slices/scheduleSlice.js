import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { scheduleAPI } from '../../services/api';

// 異步action - 獲取排班列表
export const fetchSchedules = createAsyncThunk(
  'schedule/fetchSchedules',
  async (params, { rejectWithValue }) => {
    try {
      const response = await scheduleAPI.getSchedules(params);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || '獲取排班列表失敗');
    }
  }
);

// 異步action - 獲取個人排班
export const fetchMySchedules = createAsyncThunk(
  'schedule/fetchMySchedules',
  async (params, { rejectWithValue }) => {
    try {
      const response = await scheduleAPI.getMySchedules(params);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || '獲取個人排班失敗');
    }
  }
);

// 異步action - 創建排班
export const createSchedule = createAsyncThunk(
  'schedule/createSchedule',
  async (scheduleData, { rejectWithValue }) => {
    try {
      const response = await scheduleAPI.createSchedule(scheduleData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || '創建排班失敗');
    }
  }
);

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState: {
    schedules: [],
    mySchedules: [],
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 獲取排班列表
      .addCase(fetchSchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchedules.fulfilled, (state, action) => {
        state.loading = false;
        state.schedules = action.payload.schedules;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // 獲取個人排班
      .addCase(fetchMySchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMySchedules.fulfilled, (state, action) => {
        state.loading = false;
        state.mySchedules = action.payload.schedules;
        state.error = null;
      })
      .addCase(fetchMySchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // 創建排班
      .addCase(createSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSchedule.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(createSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = scheduleSlice.actions;

// 選擇器
export const selectSchedules = (state) => state.schedule.schedules;
export const selectMySchedules = (state) => state.schedule.mySchedules;
export const selectSchedulePagination = (state) => state.schedule.pagination;
export const selectScheduleLoading = (state) => state.schedule.loading;
export const selectScheduleError = (state) => state.schedule.error;

export default scheduleSlice.reducer;

