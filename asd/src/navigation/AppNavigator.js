import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/slices/authSlice';

// 導入頁面組件
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/home/HomeScreen';
import RecipeListScreen from '../screens/recipe/RecipeListScreen';
import RecipeDetailScreen from '../screens/recipe/RecipeDetailScreen';
import ScheduleScreen from '../screens/schedule/ScheduleScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 認證相關的導航堆疊
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

// 配方相關的導航堆疊
function RecipeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="RecipeList" 
        component={RecipeListScreen}
        options={{ title: '配方列表' }}
      />
      <Stack.Screen 
        name="RecipeDetail" 
        component={RecipeDetailScreen}
        options={{ title: '配方詳情' }}
      />
    </Stack.Navigator>
  );
}

// 主要的底部標籤導航
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: '首頁',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Recipes" 
        component={RecipeStack}
        options={{
          title: '配方',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen}
        options={{
          title: '排班',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: '個人',
        }}
      />
    </Tab.Navigator>
  );
}

// 主導航器
export default function AppNavigator() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

