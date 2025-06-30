import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Input, Button } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, restoreAuthState, selectAuthLoading, selectAuthError } from '../../store/slices/authSlice';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const dispatch = useDispatch();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  useEffect(() => {
    // 應用啟動時嘗試恢復登錄狀態
    dispatch(restoreAuthState());
  }, [dispatch]);

  useEffect(() => {
    // 顯示錯誤信息
    if (error) {
      Alert.alert('登錄失敗', error);
    }
  }, [error]);

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('錯誤', '請輸入用戶名和密碼');
      return;
    }

    dispatch(loginUser({ username: username.trim(), password }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>配方排班管理系統</Text>
          <Text style={styles.subtitle}>請登錄您的帳號</Text>

          <Input
            placeholder="用戶名或郵箱"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon={{ type: 'font-awesome', name: 'user' }}
            containerStyle={styles.inputContainer}
          />

          <Input
            placeholder="密碼"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={{ type: 'font-awesome', name: 'lock' }}
            containerStyle={styles.inputContainer}
          />

          <Button
            title="登錄"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            buttonStyle={styles.loginButton}
            titleStyle={styles.loginButtonText}
          />

          <View style={styles.demoContainer}>
            <Text style={styles.demoTitle}>測試帳號：</Text>
            <Text style={styles.demoText}>管理員: admin / password123</Text>
            <Text style={styles.demoText}>主廚: chef_wang / password123</Text>
            <Text style={styles.demoText}>員工: staff_chen / password123</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 15,
  },
  loginButton: {
    backgroundColor: '#2196F3',
    borderRadius: 5,
    paddingVertical: 12,
    marginTop: 20,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  demoContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  demoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
});

