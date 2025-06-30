import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Card, ListItem, Button } from 'react-native-elements';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, logoutUser } from '../../store/slices/authSlice';

export default function ProfileScreen() {
  const currentUser = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'super_admin': '超級管理員',
      'admin': '管理員',
      'chef': '主廚',
      'staff': '員工',
    };
    return roleMap[role] || role;
  };

  const handleLogout = () => {
    Alert.alert(
      '確認登出',
      '您確定要登出嗎？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '登出', 
          style: 'destructive',
          onPress: () => dispatch(logoutUser())
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* 用戶信息卡片 */}
      <Card containerStyle={styles.card}>
        <Card.Title>個人信息</Card.Title>
        <Card.Divider />
        
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title>姓名</ListItem.Title>
            <ListItem.Subtitle>{currentUser?.full_name}</ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
        
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title>用戶名</ListItem.Title>
            <ListItem.Subtitle>{currentUser?.username}</ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
        
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title>郵箱</ListItem.Title>
            <ListItem.Subtitle>{currentUser?.email}</ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
        
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title>角色</ListItem.Title>
            <ListItem.Subtitle>{getRoleDisplayName(currentUser?.role)}</ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
        
        {currentUser?.phone && (
          <ListItem bottomDivider>
            <ListItem.Content>
              <ListItem.Title>電話</ListItem.Title>
              <ListItem.Subtitle>{currentUser.phone}</ListItem.Subtitle>
            </ListItem.Content>
          </ListItem>
        )}
      </Card>

      {/* 設置選項 */}
      <Card containerStyle={styles.card}>
        <Card.Title>設置</Card.Title>
        <Card.Divider />
        
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title>修改密碼</ListItem.Title>
          </ListItem.Content>
          <ListItem.Chevron />
        </ListItem>
        
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title>通知設置</ListItem.Title>
          </ListItem.Content>
          <ListItem.Chevron />
        </ListItem>
        
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title>關於應用</ListItem.Title>
          </ListItem.Content>
          <ListItem.Chevron />
        </ListItem>
      </Card>

      {/* 登出按鈕 */}
      <View style={styles.logoutContainer}>
        <Button
          title="登出"
          onPress={handleLogout}
          buttonStyle={styles.logoutButton}
          titleStyle={styles.logoutButtonText}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    borderRadius: 10,
    marginHorizontal: 15,
    marginTop: 15,
  },
  logoutContainer: {
    margin: 20,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    borderRadius: 5,
    paddingVertical: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

