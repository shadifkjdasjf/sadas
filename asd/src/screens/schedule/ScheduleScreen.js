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
import { Card, Badge, Button, ButtonGroup } from 'react-native-elements';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchSchedules, 
  fetchMySchedules,
  selectSchedules, 
  selectScheduleLoading,
  selectScheduleError 
} from '../../store/slices/scheduleSlice';

export default function ScheduleScreen({ navigation }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  const dispatch = useDispatch();
  const schedules = useSelector(selectSchedules);
  const loading = useSelector(selectScheduleLoading);
  const error = useSelector(selectScheduleError);
  const currentUser = useSelector(state => state.auth.user);

  const buttons = ['我的排班', '全部排班'];

  useEffect(() => {
    loadData();
  }, [dispatch, selectedIndex]);

  useEffect(() => {
    if (error) {
      Alert.alert('錯誤', error);
    }
  }, [error]);

  const loadData = () => {
    if (selectedIndex === 0) {
      dispatch(fetchMySchedules());
    } else {
      dispatch(fetchSchedules());
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const getShiftTypeText = (shiftType) => {
    switch (shiftType) {
      case 'morning': return '早班';
      case 'afternoon': return '午班';
      case 'evening': return '晚班';
      default: return shiftType;
    }
  };

  const getShiftTypeColor = (shiftType) => {
    switch (shiftType) {
      case 'morning': return '#FF9800';
      case 'afternoon': return '#2196F3';
      case 'evening': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled': return '已安排';
      case 'confirmed': return '已確認';
      case 'completed': return '已完成';
      case 'absent': return '缺勤';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return '#FF9800';
      case 'confirmed': return '#2196F3';
      case 'completed': return '#4CAF50';
      case 'absent': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    });
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5); // HH:MM
  };

  const handleSchedulePress = (schedule) => {
    // 如果是員工且是自己的排班，可以更新狀態
    if (currentUser?.role === 'staff' && schedule.user_id === currentUser.id) {
      showStatusUpdateDialog(schedule);
    }
  };

  const showStatusUpdateDialog = (schedule) => {
    const statusOptions = [
      { text: '取消', style: 'cancel' },
      { text: '確認', onPress: () => updateScheduleStatus(schedule.id, 'confirmed') },
      { text: '完成', onPress: () => updateScheduleStatus(schedule.id, 'completed') },
    ];

    Alert.alert(
      '更新排班狀態',
      `${formatDate(schedule.shift_date)} ${getShiftTypeText(schedule.shift_type)}`,
      statusOptions
    );
  };

  const updateScheduleStatus = (scheduleId, status) => {
    // TODO: 實現狀態更新功能
    Alert.alert('提示', '狀態更新功能待實現');
  };

  const renderScheduleItem = ({ item }) => (
    <Card containerStyle={styles.scheduleCard}>
      <TouchableOpacity
        onPress={() => handleSchedulePress(item)}
        disabled={currentUser?.role !== 'staff' || item.user_id !== currentUser.id}
      >
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleDate}>{formatDate(item.shift_date)}</Text>
          <View style={styles.badgeContainer}>
            <Badge
              value={getShiftTypeText(item.shift_type)}
              badgeStyle={[styles.shiftBadge, { backgroundColor: getShiftTypeColor(item.shift_type) }]}
              textStyle={styles.badgeText}
            />
            <Badge
              value={getStatusText(item.status)}
              badgeStyle={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}
              textStyle={styles.badgeText}
            />
          </View>
        </View>
        
        <View style={styles.scheduleInfo}>
          <Text style={styles.timeText}>
            {formatTime(item.start_time)} - {formatTime(item.end_time)}
          </Text>
          {selectedIndex === 1 && (
            <Text style={styles.userText}>員工: {item.user_name}</Text>
          )}
        </View>
        
        {item.notes && (
          <Text style={styles.notesText}>備註: {item.notes}</Text>
        )}
        
        <Text style={styles.creatorText}>安排者: {item.creator_name}</Text>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ButtonGroup
        onPress={setSelectedIndex}
        selectedIndex={selectedIndex}
        buttons={buttons}
        containerStyle={styles.buttonGroup}
        selectedButtonStyle={styles.selectedButton}
      />
      
      <FlatList
        data={schedules}
        renderItem={renderScheduleItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? '載入中...' : '沒有排班記錄'}
            </Text>
          </View>
        }
      />
      
      {/* 管理員可以添加排班 */}
      {currentUser?.role && ['admin', 'super_admin'].includes(currentUser.role) && (
        <View style={styles.fabContainer}>
          <Button
            title="新增排班"
            onPress={() => Alert.alert('提示', '新增排班功能待實現')}
            buttonStyle={styles.fab}
            titleStyle={styles.fabText}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  buttonGroup: {
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 5,
  },
  selectedButton: {
    backgroundColor: '#2196F3',
  },
  scheduleCard: {
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 5,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scheduleDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  shiftBadge: {
    borderRadius: 12,
    marginRight: 5,
  },
  statusBadge: {
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
  },
  scheduleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  userText: {
    fontSize: 14,
    color: '#666',
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  creatorText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
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
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fab: {
    backgroundColor: '#2196F3',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  fabText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

