import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Card, Badge, Divider } from 'react-native-elements';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchRecipeDetail,
  selectCurrentRecipe,
  selectRecipeLoading,
  selectRecipeError,
  clearCurrentRecipe 
} from '../../store/slices/recipeSlice';

export default function RecipeDetailScreen({ route, navigation }) {
  const { recipeId } = route.params;
  
  const dispatch = useDispatch();
  const recipe = useSelector(selectCurrentRecipe);
  const loading = useSelector(selectRecipeLoading);
  const error = useSelector(selectRecipeError);

  useEffect(() => {
    if (recipeId) {
      dispatch(fetchRecipeDetail(recipeId));
    }
    
    return () => {
      dispatch(clearCurrentRecipe());
    };
  }, [dispatch, recipeId]);

  useEffect(() => {
    if (error) {
      Alert.alert('錯誤', error, [
        { text: '確定', onPress: () => navigation.goBack() }
      ]);
    }
  }, [error, navigation]);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>載入中...</Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>配方不存在</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 配方基本信息 */}
      <Card containerStyle={styles.card}>
        <View style={styles.header}>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          <Badge
            value={getDifficultyText(recipe.difficulty_level)}
            badgeStyle={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty_level) }]}
            textStyle={styles.badgeText}
          />
        </View>
        
        <Text style={styles.description}>{recipe.description}</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>分類</Text>
            <Text style={styles.infoValue}>{recipe.category_name}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>份量</Text>
            <Text style={styles.infoValue}>{recipe.servings}人份</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>準備時間</Text>
            <Text style={styles.infoValue}>{recipe.prep_time}分鐘</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>烹飪時間</Text>
            <Text style={styles.infoValue}>{recipe.cook_time}分鐘</Text>
          </View>
        </View>
        
        <Text style={styles.creatorText}>創建者: {recipe.creator_name}</Text>
      </Card>

      {/* 食材列表 */}
      <Card containerStyle={styles.card}>
        <Card.Title>食材清單</Card.Title>
        <Divider />
        {recipe.ingredients && recipe.ingredients.length > 0 ? (
          recipe.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientItem}>
              <Text style={styles.ingredientName}>{ingredient.ingredient_name}</Text>
              <Text style={styles.ingredientQuantity}>
                {ingredient.quantity} {ingredient.unit}
              </Text>
              {ingredient.notes && (
                <Text style={styles.ingredientNotes}>{ingredient.notes}</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>暫無食材信息</Text>
        )}
      </Card>

      {/* 製作步驟 */}
      <Card containerStyle={styles.card}>
        <Card.Title>製作步驟</Card.Title>
        <Divider />
        {recipe.steps && recipe.steps.length > 0 ? (
          recipe.steps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.step_number}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepInstruction}>{step.instruction}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>暫無製作步驟</Text>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  recipeName: {
    fontSize: 24,
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
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  creatorText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'right',
    marginTop: 10,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ingredientName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  ingredientQuantity: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  ingredientNotes: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});

