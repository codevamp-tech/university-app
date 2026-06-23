import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { createBroadcastAPI, getBroadcastStatsAPI, getDepartmentsAPI } from '../../data/apiService';

const BATCHES = [
  { id: 2026, label: '1st Year (2026)' },
  { id: 2025, label: '2nd Year (2025)' },
  { id: 2024, label: '3rd Year (2024)' },
  { id: 2023, label: '4th Year (2023)' },
];

const AdminBroadcastCenterScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState('all'); // 'all', 'department', 'batch', 'custom'
  const [departments, setDepartments] = useState([]);
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [sending, setSending] = useState(false);
  
  // History State
  const [stats, setStats] = useState({ total_sent: 0, recent: [] });
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchInitialData = async () => {
    try {
      if (accessToken) {
        // Fetch departments
        const depts = await getDepartmentsAPI(accessToken);
        setDepartments(depts || [
          { id: '1', name: 'B.Tech Computer Science', code: 'CSE' },
          { id: '2', name: 'B.Tech Electronics', code: 'ECE' },
          { id: '3', name: 'B.Tech Mechanical', code: 'ME' },
          { id: '4', name: 'MBBS Medical', code: 'MBBS' },
        ]);
        
        // Fetch recent broadcasts
        const bStats = await getBroadcastStatsAPI(accessToken);
        if (bStats) setStats(bStats);
      }
    } catch (e) {
      console.warn('[BroadcastCenter] Init fetch error:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [accessToken]);

  const toggleDept = (id) => {
    if (selectedDepts.includes(id)) {
      setSelectedDepts(selectedDepts.filter(item => item !== id));
    } else {
      setSelectedDepts([...selectedDepts, id]);
    }
  };

  const toggleBatch = (year) => {
    if (selectedBatches.includes(year)) {
      setSelectedBatches(selectedBatches.filter(item => item !== year));
    } else {
      setSelectedBatches([...selectedBatches, year]);
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Incomplete Fields', 'Please provide a title and message content.');
      return;
    }

    setSending(true);
    try {
      const payload = {
        title: title.trim(),
        body: message.trim(),
        urgency: 'high',
        type: 'announcement',
        target_type: targetType,
        target_department_ids: targetType === 'department' || targetType === 'custom' ? selectedDepts : null,
        target_batch_years: targetType === 'batch' || targetType === 'custom' ? selectedBatches : null,
      };

      const res = await createBroadcastAPI(accessToken, payload);
      if (res) {
        Alert.alert('Success', 'Push notifications sent successfully.');
        setTitle('');
        setMessage('');
        setSelectedDepts([]);
        setSelectedBatches([]);
        setTargetType('all');
        
        // Refresh stats
        const bStats = await getBroadcastStatsAPI(accessToken);
        if (bStats) setStats(bStats);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to send broadcast.');
    } finally {
      setSending(false);
    }
  };

  const calculatedReach = () => {
    if (targetType === 'all') return '~350';
    let base = 0;
    if (targetType === 'department') base += selectedDepts.length * 60;
    if (targetType === 'batch') base += selectedBatches.length * 80;
    if (targetType === 'custom') base += (selectedDepts.length * 15) + (selectedBatches.length * 20);
    return base || '0';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Back Button & Title */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Broadcast Center</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Publish targeted emergency alerts & reminders</Text>
          </View>
        </View>

        {/* Input Fields */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>ALERT TITLE</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="e.g. Fees Submission Last Date Reminder"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>MESSAGE BODY</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, height: 80 }]}
            multiline
            numberOfLines={3}
            placeholder="Write details of the push notification alert..."
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={setMessage}
          />
        </View>

        {/* Targeting Selector */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Target Audience</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.targetingTabs}>
            {['all', 'department', 'batch', 'custom'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.targetTab,
                  targetType === t && [styles.activeTargetTab, { backgroundColor: colors.primary }]
                ]}
                onPress={() => setTargetType(t)}
              >
                <Text style={[
                  styles.targetTabText,
                  { color: targetType === t ? '#FFF' : colors.textPrimary }
                ]}>
                  {t.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Department Picker */}
          {(targetType === 'department' || targetType === 'custom') && (
            <View style={styles.filterSection}>
              <Text style={[styles.filterTitle, { color: colors.textPrimary }]}>Select Departments:</Text>
              <View style={styles.checkboxContainer}>
                {departments.map((dept) => {
                  const isChecked = selectedDepts.includes(dept.id);
                  return (
                    <TouchableOpacity
                      key={dept.id}
                      style={[
                        styles.checkboxChip,
                        isChecked ? { backgroundColor: colors.primaryLight, borderColor: colors.primary } : { borderColor: colors.border }
                      ]}
                      onPress={() => toggleDept(dept.id)}
                    >
                      <Feather 
                        name={isChecked ? 'check-square' : 'square'} 
                        size={14} 
                        color={isChecked ? colors.primary : colors.textSecondary} 
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.checkboxText, { color: isChecked ? colors.primary : colors.textPrimary }]}>
                        {dept.code || dept.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Batch Year Picker */}
          {(targetType === 'batch' || targetType === 'custom') && (
            <View style={styles.filterSection}>
              <Text style={[styles.filterTitle, { color: colors.textPrimary }]}>Select Batch Years:</Text>
              <View style={styles.checkboxContainer}>
                {BATCHES.map((batch) => {
                  const isChecked = selectedBatches.includes(batch.id);
                  return (
                    <TouchableOpacity
                      key={batch.id}
                      style={[
                        styles.checkboxChip,
                        isChecked ? { backgroundColor: colors.primaryLight, borderColor: colors.primary } : { borderColor: colors.border }
                      ]}
                      onPress={() => toggleBatch(batch.id)}
                    >
                      <Feather 
                        name={isChecked ? 'check-square' : 'square'} 
                        size={14} 
                        color={isChecked ? colors.primary : colors.textSecondary} 
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.checkboxText, { color: isChecked ? colors.primary : colors.textPrimary }]}>
                        {batch.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Reach Estimate Banner */}
          <View style={[styles.reachContainer, { backgroundColor: colors.background }]}>
            <Feather name="users" size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.reachText, { color: colors.textPrimary }]}>
              Estimated Reach: <Text style={{ fontWeight: '700', color: colors.primary }}>{calculatedReach()}</Text> students.
            </Text>
          </View>

          {/* Send Action */}
          <TouchableOpacity 
            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
            onPress={handleSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Feather name="send" size={16} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.sendBtnText}>Dispatch Broadcast Alert</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* History Stats Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Dispatches ({stats.total_sent})</Text>
        {loadingStats ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : stats.recent.length === 0 ? (
          <Text style={[styles.emptyHistory, { color: colors.textMuted }]}>No previous broadcasts.</Text>
        ) : (
          <View style={styles.historyList}>
            {stats.recent.map((item) => (
              <View key={item.id} style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                <View style={styles.historyMeta}>
                  <View style={styles.metaBadge}>
                    <Text style={[styles.metaBadgeText, { color: colors.textSecondary }]}>Target: {item.target_type?.toUpperCase()}</Text>
                  </View>
                  <Text style={[styles.metaSentText, { color: colors.textMuted }]}>
                    Sent to: {item.sent_count} | Opened: {item.opened_count || 0}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    marginTop: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
    elevation: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  targetingTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  targetTab: {
    flex: 1,
    minWidth: '22%',
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeTargetTab: {
    borderColor: 'transparent',
  },
  targetTabText: {
    fontSize: 10,
    fontWeight: '700',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkboxChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  checkboxText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reachContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  reachText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sendBtn: {
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyHistory: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  historyList: {
    gap: 10,
  },
  historyCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  historyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaBadgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  metaSentText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default AdminBroadcastCenterScreen;
