import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Card, Avatar } from 'react-native-elements';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { fetchMySchedules, selectMySchedules } from '../../store/slices/scheduleSlice';

export default function HomeScreen({ navigation }) {
  const currentUser = useSelector(selectCurrentUser);
  const mySchedules = useSelector(selectMySchedules);
  const dispatch = useDispatch();

  useEffect(() => {
    // 獲取今日排班信息
    const today = new Date().toISOString().split('T')[0];
    dispatch(fetchMySchedules({ date: today }));
  }, [dispatch]);

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'super_admin': '超級管理員',
      'admin': '管理員',
      'chef': '主廚',
      'staff': '員工',
    };
    return roleMap[role] || role;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const todaySchedules = mySchedules.filter(schedule => {
    const today = new Date().toISOString().split('T')[0];
    return schedule.shift_date === today;
  });

  return (
    <ScrollView style={styles.container}>
      {/* 用戶歡迎卡片 */}
      <Card containerStyle={styles.welcomeCard}>
        <View style={styles.welcomeContent}>
          <Avatar
            rounded
            size="medium"
            title={currentUser?.full_name?.charAt(0) || 'U'}
            backgroundColor="#2196F3"
          />
          <View style={styles.welcomeText}>
            <Text style={styles.greeting}>
              {getGreeting()}，{currentUser?.full_name}
            </Text>
            <Text style={styles.role}>
              {getRoleDisplayName(currentUser?.role)}
            </Text>
          </View>
        </View>
      </Card>

      {/* 今日排班 */}
      <Card containerStyle={styles.card}>
        <Card.Title>今日排班</Card.Title>
        <Card.Divider />
        {todaySchedules.length > 0 ? (
          todaySchedules.map((schedule, index) => (
            <View key={index} style={styles.scheduleItem}>
              <Text style={styles.scheduleType}>
                {schedule.shift_type === 'morning' ? '早班' : 
                 schedule.shift_type === 'afternoon' ? '中班' : '晚班'}
              </Text>
              <Text style={styles.scheduleTime}>
                {schedule.start_time} - {schedule.end_time}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noSchedule}>今日無排班</Text>
        )}
      </Card>

      {/* 快捷功能 */}
      <Card containerStyle={styles.card}>
        <Card.Title>快捷功能</Card.Title>
        <Card.Divider />
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Recipes')}
          >
            <Text style={styles.actionButtonText}>查看配方</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Schedule')}
          >
            <Text style={styles.actionButtonText}>我的排班</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* 系統統計 */}
      {(currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && (
        <Card containerStyle={styles.card}>
          <Card.Title>系統概覽</Card.Title>
          <Card.Divider />
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>--</Text>
              <Text style={styles.statLabel}>總配方數</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>--</Text>
              <Text style={styles.statLabel}>員工數量</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>--</Text>
              <Text style={styles.statLabel}>本週排班</Text>
            </View>
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeCard: {
    borderRadius: 10,
    marginHorizontal: 15,
    marginTop: 15,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    marginLeft: 15,
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  role: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  card: {
    borderRadius: 10,
    marginHorizontal: 15,
    marginTop: 15,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scheduleType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  scheduleTime: {
    fontSize: 14,
    color: '#666',
  },
  noSchedule: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});

