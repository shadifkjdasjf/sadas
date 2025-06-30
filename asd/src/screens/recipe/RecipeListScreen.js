import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SearchBar, Card, Badge, Button } from 'react-native-elements';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchRecipes, 
  fetchRecipeCategories,
  selectRecipes, 
  selectRecipeCategories,
  selectRecipeLoading,
  selectRecipeError 
} from '../../store/slices/recipeSlice';

export default function RecipeListScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const dispatch = useDispatch();
  const recipes = useSelector(selectRecipes);
  const categories = useSelector(selectRecipeCategories);
  const loading = useSelector(selectRecipeLoading);
  const error = useSelector(selectRecipeError);

  useEffect(() => {
    loadData();
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      Alert.alert('錯誤', error);
    }
  }, [error]);

  const loadData = () => {
    dispatch(fetchRecipes({ search, category_id: selectedCategory }));
    dispatch(fetchRecipeCategories());
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const handleSearch = () => {
    dispatch(fetchRecipes({ search, category_id: selectedCategory }));
  };

  const handleCategoryFilter = (categoryId) => {
    const newCategory = categoryId === selectedCategory ? null : categoryId;
    setSelectedCategory(newCategory);
    dispatch(fetchRecipes({ search, category_id: newCategory }));
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '簡單';
      case 'medium': return '中等';
      case 'hard': return '困難';
      default: return difficulty;
    }
  };

  const renderRecipeItem = ({ item }) => (
    <Card containerStyle={styles.recipeCard}>
      <TouchableOpacity
        onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
      >
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeName}>{item.name}</Text>
          <Badge
            value={getDifficultyText(item.difficulty_level)}
            badgeStyle={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty_level) }]}
            textStyle={styles.badgeText}
          />
        </View>
        
        <Text style={styles.recipeDescription}>{item.description}</Text>
        
        <View style={styles.recipeInfo}>
          <Text style={styles.infoText}>分類: {item.category_name}</Text>
          <Text style={styles.infoText}>份量: {item.servings}人份</Text>
        </View>
        
        <View style={styles.recipeTime}>
          <Text style={styles.timeText}>準備: {item.prep_time}分鐘</Text>
          <Text style={styles.timeText}>烹飪: {item.cook_time}分鐘</Text>
        </View>
        
        <Text style={styles.creatorText}>創建者: {item.creator_name}</Text>
      </TouchableOpacity>
    </Card>
  );

  const renderCategoryFilter = () => (
    <View style={styles.categoryContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ id: null, name: '全部' }, ...categories]}
        keyExtractor={(item) => item.id?.toString() || 'all'}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === item.id && styles.selectedCategoryButton
            ]}
            onPress={() => handleCategoryFilter(item.id)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === item.id && styles.selectedCategoryButtonText
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <SearchBar
        placeholder="搜索配方..."
        onChangeText={setSearch}
        value={search}
        onSubmitEditing={handleSearch}
        containerStyle={styles.searchContainer}
        inputContainerStyle={styles.searchInputContainer}
      />
      
      {renderCategoryFilter()}
      
      <FlatList
        data={recipes}
        renderItem={renderRecipeItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? '載入中...' : '沒有找到配方'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    backgroundColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    paddingHorizontal: 15,
  },
  searchInputContainer: {
    backgroundColor: 'white',
  },
  categoryContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedCategoryButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  categoryButtonText: {
    color: '#666',
    fontSize: 14,
  },
  selectedCategoryButtonText: {
    color: 'white',
  },
  recipeCard: {
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 5,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  difficultyBadge: {
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
  },
  recipeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  recipeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 12,
    color: '#888',
  },
  recipeTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  timeText: {
    fontSize: 12,
    color: '#888',
  },
  creatorText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

