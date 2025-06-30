import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { recipeAPI } from '../../services/api';

// 異步action - 獲取配方列表
export const fetchRecipes = createAsyncThunk(
  'recipe/fetchRecipes',
  async (params, { rejectWithValue }) => {
    try {
      const response = await recipeAPI.getRecipes(params);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || '獲取配方列表失敗');
    }
  }
);

// 異步action - 獲取配方詳情
export const fetchRecipeDetail = createAsyncThunk(
  'recipe/fetchRecipeDetail',
  async (id, { rejectWithValue }) => {
    try {
      const response = await recipeAPI.getRecipe(id);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || '獲取配方詳情失敗');
    }
  }
);

// 異步action - 獲取配方分類
export const fetchRecipeCategories = createAsyncThunk(
  'recipe/fetchRecipeCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await recipeAPI.getCategories();
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || '獲取配方分類失敗');
    }
  }
);

const recipeSlice = createSlice({
  name: 'recipe',
  initialState: {
    recipes: [],
    currentRecipe: null,
    categories: [],
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentRecipe: (state) => {
      state.currentRecipe = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 獲取配方列表
      .addCase(fetchRecipes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipes.fulfilled, (state, action) => {
        state.loading = false;
        state.recipes = action.payload.recipes;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchRecipes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // 獲取配方詳情
      .addCase(fetchRecipeDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipeDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRecipe = action.payload;
        state.error = null;
      })
      .addCase(fetchRecipeDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // 獲取配方分類
      .addCase(fetchRecipeCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipeCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
        state.error = null;
      })
      .addCase(fetchRecipeCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentRecipe } = recipeSlice.actions;

// 選擇器
export const selectRecipes = (state) => state.recipe.recipes;
export const selectCurrentRecipe = (state) => state.recipe.currentRecipe;
export const selectRecipeCategories = (state) => state.recipe.categories;
export const selectRecipePagination = (state) => state.recipe.pagination;
export const selectRecipeLoading = (state) => state.recipe.loading;
export const selectRecipeError = (state) => state.recipe.error;

export default recipeSlice.reducer;

