import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  TextInput, Dimensions, Animated, Platform, ActivityIndicator, Alert, Modal
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getFoundationFacultyList, getFoundationData, saveFoundationData } from '../../data/apiService';

const BATCH_YEAR_TO_CD = {
  2025: '66', 2024: '63', 2023: '60', 2022: '61',
  2021: '62', 2020: '64', 2019: '65',
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const formatDateDisplay = (isoStr) => {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
};

const parseMicrosoftDate = (str) => {
  if (!str) return null;
  if (typeof str === 'string' && str.startsWith('/Date(')) {
    const num = parseInt(str.substring(6, str.length - 2), 10);
    if (!isNaN(num)) {
      return new Date(num);
    }
  }
  return new Date(str);
};

const formatParsedDate = (str) => {
  if (!str) return '—';
  if (typeof str === 'string' && !str.startsWith('/Date(') && str.includes('-') && str.length <= 10) {
    return formatDateDisplay(str);
  }
  try {
    const d = parseMicrosoftDate(str);
    if (d && !isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mm = months[d.getMonth()];
      const yyyy = d.getFullYear();
      return `${dd} ${mm} ${yyyy}`;
    }
  } catch (err) {
    console.warn('Error parsing date:', err);
  }
  return String(str);
};

const formatParsedTime = (str) => {
  if (!str) return '—';
  if (typeof str === 'string' && !str.startsWith('/Date(')) {
    return str;
  }
  try {
    const d = parseMicrosoftDate(str);
    if (d && !isNaN(d.getTime())) {
      let h = d.getHours();
      const m = String(d.getMinutes()).padStart(2, '0');
      const per = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${String(h).padStart(2, '0')}:${m} ${per}`;
    }
  } catch (err) {
    console.warn('Error parsing time:', err);
  }
  return String(str);
};


const todayIso = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

const nowTime = () => {
  const n = new Date();
  let h = n.getHours();
  const m = String(n.getMinutes()).padStart(2, '0');
  const per = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${per}`;
};

// ─── Skeleton ────────────────────────────────────────────────────────────────
const SkeletonBlock = ({ width: w, height, borderRadius = 8, style }) => {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[{ width: w, height, borderRadius, backgroundColor: '#E5E7EB', opacity: anim }, style]} />
  );
};

const SkeletonCard = ({ colors }) => (
  <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, gap: 10, borderWidth: 1, borderColor: colors.border }}>
    <SkeletonBlock width="35%" height={10} />
    <SkeletonBlock width="75%" height={14} />
    <SkeletonBlock width="55%" height={10} />
    <SkeletonBlock width="90%" height={10} />
  </View>
);

// ─── Calendar Modal ──────────────────────────────────────────────────────────
const CalendarModal = ({ visible, selectedDate, onSelect, onClose, colors, isDark }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  useEffect(() => {
    if (visible && selectedDate) {
      const d = new Date(selectedDate);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [visible]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMon = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMon; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const selDate = new Date(selectedDate);
  const isSelected = (d) =>
    d && selDate.getDate() === d && selDate.getMonth() === viewMonth && selDate.getFullYear() === viewYear;
  const isToday = (d) =>
    d && today.getDate() === d && today.getMonth() === viewMonth && today.getFullYear() === viewYear;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={calStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[calStyles.sheet, { backgroundColor: colors.card }]}>
          <View style={calStyles.header}>
            <TouchableOpacity
              onPress={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }}
              style={calStyles.navBtn}
            >
              <Ionicons name="chevron-back" size={20} color="#7C3AED" />
            </TouchableOpacity>
            <Text style={[calStyles.monthLabel, { color: colors.textPrimary }]}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity
              onPress={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }}
              style={calStyles.navBtn}
            >
              <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {DAY_NAMES.map(d => (
              <Text key={d} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>
                {d}
              </Text>
            ))}
          </View>
          {weeks.map((week, wi) => (
            <View key={wi} style={{ flexDirection: 'row', marginBottom: 4 }}>
              {week.map((day, di) => {
                const sel = isSelected(day);
                const tod = isToday(day);
                return (
                  <TouchableOpacity
                    key={di}
                    style={[
                      { flex: 1, height: 34, justifyContent: 'center', alignItems: 'center', borderRadius: 8, margin: 1 },
                      sel && { backgroundColor: '#7C3AED' },
                      tod && !sel && { backgroundColor: isDark ? 'rgba(124,58,237,0.15)' : '#F5F3FF', borderWidth: 1, borderColor: '#7C3AED' }
                    ]}
                    onPress={() => {
                      if (day) {
                        const dt = new Date(viewYear, viewMonth, day);
                        const yyyy = dt.getFullYear();
                        const mm = String(dt.getMonth() + 1).padStart(2, '0');
                        const dd = String(dt.getDate()).padStart(2, '0');
                        onSelect(`${yyyy}-${mm}-${dd}`);
                        onClose();
                      }
                    }}
                    activeOpacity={day ? 0.7 : 1}
                  >
                    <Text style={[
                      { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
                      sel && { color: '#FFFFFF', fontWeight: '800' },
                      tod && !sel && { color: '#7C3AED', fontWeight: '700' },
                      !day && { opacity: 0 },
                    ]}>
                      {day || ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
          <TouchableOpacity
            style={{ marginTop: 12, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 32, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F3FF', borderRadius: 12, borderWidth: 1, borderColor: '#7C3AED' }}
            onPress={() => { onSelect(todayIso()); onClose(); }}
          >
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#7C3AED' }}>Today</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── Time Picker Modal ────────────────────────────────────────────────────────
const TimePickerModal = ({ visible, selectedTime, onSelect, onClose, colors }) => {
  const parseTime = (t) => {
    if (!t) return { hour: 10, minute: 0, period: 'AM' };
    const [timePart, per] = t.split(' ');
    const [h, m] = timePart.split(':').map(Number);
    return { hour: h || 10, minute: m || 0, period: per || 'AM' };
  };
  const init = parseTime(selectedTime);
  const [hour, setHour] = useState(init.hour);
  const [minute, setMinute] = useState(init.minute);
  const [period, setPeriod] = useState(init.period);

  useEffect(() => {
    if (visible) {
      const p = parseTime(selectedTime);
      setHour(p.hour); setMinute(p.minute); setPeriod(p.period);
    }
  }, [visible]);

  const formatTime = () => `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={calStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[calStyles.sheet, { backgroundColor: colors.card }]}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 24 }}>
            Select Time
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setHour(h => h === 12 ? 1 : h + 1)} style={tpStyles.arrow}>
                <Ionicons name="chevron-up" size={22} color="#7C3AED" />
              </TouchableOpacity>
              <Text style={[tpStyles.timeNum, { color: colors.textPrimary }]}>{String(hour).padStart(2, '0')}</Text>
              <TouchableOpacity onPress={() => setHour(h => h === 1 ? 12 : h - 1)} style={tpStyles.arrow}>
                <Ionicons name="chevron-down" size={22} color="#7C3AED" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '900', color: colors.textPrimary }}>:</Text>
            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setMinute(m => (m + 5) % 60)} style={tpStyles.arrow}>
                <Ionicons name="chevron-up" size={22} color="#7C3AED" />
              </TouchableOpacity>
              <Text style={[tpStyles.timeNum, { color: colors.textPrimary }]}>{String(minute).padStart(2, '0')}</Text>
              <TouchableOpacity onPress={() => setMinute(m => m === 0 ? 55 : m - 5)} style={tpStyles.arrow}>
                <Ionicons name="chevron-down" size={22} color="#7C3AED" />
              </TouchableOpacity>
            </View>
            <View style={{ gap: 8 }}>
              {['AM', 'PM'].map(p => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPeriod(p)}
                  style={[tpStyles.periodBtn, period === p && { backgroundColor: '#7C3AED', borderColor: '#7C3AED' }]}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: period === p ? '#FFF' : colors.textSecondary }}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => { onSelect(formatTime()); onClose(); }}
            style={{ backgroundColor: '#7C3AED', height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 24 }}
          >
            <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>Confirm Time</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── Faculty Picker Modal ─────────────────────────────────────────────────────
const FacultyPickerModal = ({ visible, facultyList, selectedId, onSelect, onClose, colors, loading }) => {
  const [query, setQuery] = useState('');

  // Reset search whenever modal opens
  useEffect(() => {
    if (visible) setQuery('');
  }, [visible]);

  const filtered = query.trim()
    ? facultyList.filter(f => {
        const name = (f.FacName || f.fac_name || f.name || f.EmpName || '').toLowerCase();
        return name.includes(query.toLowerCase());
      })
    : facultyList;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={calStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[calStyles.sheet, { backgroundColor: colors.card, maxHeight: '75%' }]}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>Select Faculty</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            borderWidth: 1.5, borderColor: query ? '#7C3AED' : colors.border,
            borderRadius: 12, paddingHorizontal: 12, height: 42,
            backgroundColor: colors.background, marginBottom: 12,
          }}>
            <Ionicons name="search-outline" size={16} color={query ? '#7C3AED' : colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search faculty by name..."
              placeholderTextColor={colors.textMuted}
              style={{ flex: 1, fontSize: 13, color: colors.textPrimary }}
              autoCorrect={false}
              autoCapitalize="none"
              editable={!loading}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Result count */}
          {query.trim().length > 0 && !loading && (
            <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8 }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{query}"
            </Text>
          )}

          {/* List */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={{ gap: 8, paddingVertical: 8 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 12 }}>
                    <SkeletonBlock width={36} height={36} borderRadius={18} />
                    <SkeletonBlock width="65%" height={14} />
                  </View>
                ))}
              </View>
            ) : (
              <>
                {filtered.length === 0 && (
                  <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
                    <Ionicons name="search-outline" size={32} color={colors.textMuted} />
                    <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>
                      {facultyList.length === 0 ? 'No faculty members found.' : `No results for "${query}"`}
                    </Text>
                  </View>
                )}
                {filtered.slice(0, 40).map((f, idx) => {
                  const fId = String(f.EmpID || f.EmpId || f.emp_id || f.facid || idx);
                  const fName = f.EmpName || f.FacName || f.fac_name || f.name || 'Unknown Faculty';
                  const isSelected = selectedId === fId;
                  return (
                    <TouchableOpacity
                      key={fId}
                      onPress={() => { onSelect(fId, fName); onClose(); }}
                      style={{
                        paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4,
                        backgroundColor: isSelected ? 'rgba(124,58,237,0.1)' : 'transparent',
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <View style={{
                          width: 36, height: 36, borderRadius: 18,
                          backgroundColor: isSelected ? '#7C3AED' : '#E5E7EB',
                          justifyContent: 'center', alignItems: 'center',
                        }}>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: isSelected ? '#FFF' : '#6B7280' }}>
                            {fName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text
                          style={{ fontSize: 14, color: colors.textPrimary, fontWeight: isSelected ? '700' : '500', flex: 1 }}
                          numberOfLines={1}
                        >
                          {fName}
                        </Text>
                      </View>
                      {isSelected && <Ionicons name="checkmark-circle" size={18} color="#7C3AED" />}
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
            <View style={{ height: 16 }} />
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};


// ─── Entry Card ───────────────────────────────────────────────────────────────
const FoundationEntryCard = ({ entry, colors, isDark, index, facultyList }) => {
  const [expanded, setExpanded] = useState(false);
  const isVerified = entry.fd_status === '1' || entry.fd_status === 1 || !!entry.fd_verfiedby;

  // Resolve faculty name by looking up in loaded facultyList
  const matchedFaculty = facultyList?.find(
    f => String(f.EmpID || f.EmpId || f.emp_id || f.facid) === String(entry.underfacid || entry.facul)
  );
  const facultyName = matchedFaculty
    ? (matchedFaculty.EmpName || matchedFaculty.FacName || matchedFaculty.fac_name || matchedFaculty.name)
    : (entry.facul_name || entry.facul || entry.fd_faculty || entry.underfacid || '—');

  return (
    <View style={[
      entryStyles.card,
      { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: isVerified ? '#10B981' : '#7C3AED' }
    ]}>
      {/* Header Row */}
      <TouchableOpacity
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.8}
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <View style={[entryStyles.badge, { backgroundColor: isVerified ? 'rgba(16,185,129,0.1)' : 'rgba(124,58,237,0.1)' }]}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: isVerified ? '#10B981' : '#7C3AED' }}>
                {isVerified ? '✓ VERIFIED' : '⏳ PENDING'}
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }}>
              {formatParsedDate(entry.date || entry.fd_date)}  ·  {formatParsedTime(entry.time || entry.fd_time)}
            </Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary }} numberOfLines={expanded ? undefined : 1}>
            {entry.fd_topic || entry.topic || '—'}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
            {facultyName}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
          style={{ marginLeft: 8, marginTop: 2 }}
        />
      </TouchableOpacity>

      {/* Expanded Details */}
      {expanded && (
        <View style={{ marginTop: 10, gap: 6 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', padding: 8, borderRadius: 8 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textSecondary }}>SESSION</Text>
              <Text style={{ fontSize: 12, color: colors.textPrimary, marginTop: 2 }}>2026-2027</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', padding: 8, borderRadius: 8 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textSecondary }}>STATUS</Text>
              <Text style={{ fontSize: 12, color: isVerified ? '#10B981' : '#7C3AED', fontWeight: '700', marginTop: 2 }}>
                {isVerified ? 'Verified' : 'Awaiting Faculty'}
              </Text>
            </View>
          </View>

          {[
            { label: 'WHAT HAPPENED?', val: entry.fd_reflection || entry.reflection || entry.a1 },
            { label: 'SO WHAT?', val: entry.reflection1 || entry.a2 },
            { label: 'WHAT NEXT?', val: entry.reflection2 || entry.a3 },
          ].map(({ label, val }) => val ? (
            <View key={label} style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', padding: 10, borderRadius: 8 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textSecondary }}>{label}</Text>
              <Text style={{ fontSize: 12, color: colors.textPrimary, marginTop: 3 }}>{val}</Text>
            </View>
          ) : null)}

          {isVerified && (
            <View style={{ backgroundColor: 'rgba(16,185,129,0.06)', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: '#10B981' }}>VERIFIED BY</Text>
              <Text style={{ fontSize: 12, color: colors.textPrimary, marginTop: 2 }}>
                {entry.fd_verfiedby || 'Faculty'}
              </Text>
              {entry.fd_remarks && (
                <>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#10B981', marginTop: 6 }}>FACULTY REMARKS</Text>
                  <Text style={{ fontSize: 12, color: colors.textPrimary, marginTop: 2 }}>{entry.fd_remarks}</Text>
                </>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};


// ─── Main Screen ──────────────────────────────────────────────────────────────
const FoundationLogbookScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user: contextUser } = useUser();

  const rollno = String(contextUser?.rollno || contextUser?.username || contextUser?.id || '');
  const username = String(contextUser?.name || contextUser?.full_name || '');
  const userBatchYear = parseInt(contextUser?.batch_year || contextUser?.year || '2024', 10);
  const batchCd = BATCH_YEAR_TO_CD[userBatchYear] || '63';

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [facultyList, setFacultyList] = useState([]);
  const [facultyLoading, setFacultyLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(todayIso());
  const [formTime, setFormTime] = useState(nowTime());
  const [formFacultyId, setFormFacultyId] = useState('');
  const [formFacultyName, setFormFacultyName] = useState('');
  const [formTopic, setFormTopic] = useState('');
  const [formA1, setFormA1] = useState('');
  const [formA2, setFormA2] = useState('');
  const [formA3, setFormA3] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showFacultyPicker, setShowFacultyPicker] = useState(false);

  const resetForm = () => {
    setFormDate(todayIso());
    setFormTime(nowTime());
    setFormFacultyId('');
    setFormFacultyName('');
    setFormTopic('');
    setFormA1('');
    setFormA2('');
    setFormA3('');
  };

  const loadEntries = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getFoundationData(username, rollno);
      setEntries(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('[FoundationLogbook] load error:', e);
      setEntries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFaculty = async () => {
    setFacultyLoading(true);
    const data = await getFoundationFacultyList(rollno);
    setFacultyList(data);
    setFacultyLoading(false);
  };

  useEffect(() => {
    loadEntries();
    loadFaculty();
  }, []);

  const handleSave = async () => {
    if (!formFacultyId) { Alert.alert('Required', 'Please select a faculty member.'); return; }
    if (!formTopic.trim()) { Alert.alert('Required', 'Please enter a topic.'); return; }
    if (!formA1.trim() || !formA2.trim() || !formA3.trim()) {
      Alert.alert('Required', 'Please fill all three reflection fields (What Happened, So What, What Next).');
      return;
    }

    setFormSaving(true);
    try {
      const payload = {
        username,
        rollno,
        depart: 'Foundation',
        date: formDate,
        time: formTime,
        clg_cd: '11',
        course_cd: '1',
        course_type: 'UG',
        fd_verfiedby: '',
        fd_status: '0',
        session: '16',
        facul: formFacultyId,
        fd_topic: formTopic.trim(),
        reflection: formA1.trim(),
        fd_reflection: formA1.trim(),
        reflection1: formA2.trim(),
        reflection2: formA3.trim(),
        batch: batchCd,
        other: '',
      };

      const res = await saveFoundationData(payload);
      // Treat any response without a clear error as success (ERP can return various formats)
      const isError = res && (res.error || res.Error || res.success === false);
      if (!isError) {
        Alert.alert('Saved!', 'Your foundation logbook entry has been saved successfully.');
        setShowForm(false);
        resetForm();
        loadEntries(false);
      } else {
        Alert.alert('Error', res?.error || res?.message || 'Failed to save. Please try again.');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not connect to the server. Please try again.');
    } finally {
      setFormSaving(false);
    }
  };

  const verifiedCount = entries.filter(e => e.fd_status === '1' || e.fd_status === 1 || !!e.fd_verfiedby).length;
  const pendingCount = entries.length - verifiedCount;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: colors.card }]}>
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Foundation Logbook</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Foundation Course Sessions</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => loadEntries(true)} style={[styles.iconBtn, { backgroundColor: colors.card }]}>
          <Ionicons name="refresh-outline" size={18} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ padding: 16, gap: 12 }}>
          <SkeletonCard colors={colors} />
          <SkeletonCard colors={colors} />
          <SkeletonCard colors={colors} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadEntries(false); }}
              colors={['#7C3AED']} tintColor="#7C3AED"
            />
          }
        >
          {/* Stats Banner */}
          <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 4 }}>
            <LinearGradient
              colors={isDark ? ['#4C1D95', '#5B21B6'] : ['#7C3AED', '#6D28D9']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.statsBanner}
            >
              {[
                { label: 'Total', value: entries.length },
                { label: 'Verified', value: verifiedCount },
                { label: 'Pending', value: pendingCount },
              ].map(({ label, value }, i) => (
                <React.Fragment key={label}>
                  {i > 0 && <View style={styles.statsDivider} />}
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#FFF', fontSize: 26, fontWeight: '900' }}>{value}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600' }}>{label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </LinearGradient>
          </View>

          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            {/* Form */}
            {(showForm || entries.length === 0) && (
              <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: '#7C3AED' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#7C3AED' }}>New Foundation Entry</Text>
                  <View style={{ backgroundColor: 'rgba(124,58,237,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#7C3AED' }}>Session: 2026-2027</Text>
                  </View>
                </View>

                {/* Date & Time row */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Date *</Text>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(true)}
                      style={[styles.pickerBtn, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }]}
                    >
                      <Ionicons name="calendar-outline" size={15} color="#7C3AED" style={{ marginRight: 6 }} />
                      <Text style={{ flex: 1, fontSize: 12, color: colors.textPrimary }}>{formatDateDisplay(formDate)}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Time *</Text>
                    <TouchableOpacity
                      onPress={() => setShowTimePicker(true)}
                      style={[styles.pickerBtn, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }]}
                    >
                      <Ionicons name="time-outline" size={15} color="#7C3AED" style={{ marginRight: 6 }} />
                      <Text style={{ flex: 1, fontSize: 12, color: colors.textPrimary }}>{formTime}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Faculty */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Faculty *</Text>
                  <TouchableOpacity
                    onPress={() => setShowFacultyPicker(true)}
                    style={[styles.pickerBtn, { borderColor: formFacultyId ? '#7C3AED' : colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }]}
                  >
                    {facultyLoading
                      ? <ActivityIndicator size="small" color="#7C3AED" style={{ marginRight: 8 }} />
                      : <Ionicons name="person-outline" size={15} color="#7C3AED" style={{ marginRight: 8 }} />
                    }
                    <Text style={{ flex: 1, fontSize: 13, color: formFacultyId ? colors.textPrimary : colors.textMuted }}>
                      {facultyLoading ? 'Loading faculty...' : formFacultyId ? formFacultyName : 'Select faculty'}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Topic */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Topic *</Text>
                  <TextInput
                    value={formTopic}
                    onChangeText={setFormTopic}
                    placeholder="Enter the session topic"
                    placeholderTextColor={colors.textMuted}
                    multiline numberOfLines={2}
                    style={[styles.textArea, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }]}
                  />
                </View>

                {/* Reflections */}
                {[
                  { label: 'What Happened? *', ph: 'Describe the event or learning experience', val: formA1, set: setFormA1 },
                  { label: 'So What? *', ph: 'What did it mean to you / what did you learn?', val: formA2, set: setFormA2 },
                  { label: 'What Next? *', ph: 'How will you apply this learning?', val: formA3, set: setFormA3 },
                ].map(({ label, ph, val, set }) => (
                  <View key={label} style={{ marginBottom: 12 }}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
                    <TextInput
                      value={val}
                      onChangeText={set}
                      placeholder={ph}
                      placeholderTextColor={colors.textMuted}
                      multiline numberOfLines={3}
                      style={[styles.textArea, { minHeight: 72, borderColor: colors.border, color: colors.textPrimary, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }]}
                    />
                  </View>
                ))}

                {/* Save Button */}
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={formSaving}
                  style={[styles.saveBtn, { opacity: formSaving ? 0.7 : 1 }]}
                >
                  {formSaving
                    ? <ActivityIndicator size="small" color="#FFF" />
                    : <Ionicons name="save-outline" size={16} color="#FFF" />
                  }
                  <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800', marginLeft: 6 }}>
                    {formSaving ? 'Saving...' : 'Save Entry'}
                  </Text>
                </TouchableOpacity>

                {entries.length > 0 && (
                  <TouchableOpacity
                    onPress={() => { setShowForm(false); resetForm(); }}
                    disabled={formSaving}
                    style={[styles.cancelBtn, { borderColor: colors.border }]}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '700' }}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Add New Button */}
            {!showForm && entries.length > 0 && (
              <TouchableOpacity
                onPress={() => { resetForm(); setShowForm(true); }}
                style={styles.addBtn}
              >
                <Ionicons name="add-circle" size={18} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800', marginLeft: 6 }}>+ Add New Entry</Text>
              </TouchableOpacity>
            )}

            {/* Info Note — multiple entries allowed */}
            {entries.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, marginTop: 4 }}>
                <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
                <Text style={{ fontSize: 11, color: colors.textMuted }}>
                  You can add multiple entries on the same date and time.
                </Text>
              </View>
            )}

            {/* Entries Header */}
            {entries.length > 0 && (
              <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary, marginBottom: 8 }}>
                Your Entries ({entries.length})
              </Text>
            )}

            {entries.map((entry, idx) => (
              <FoundationEntryCard
                key={entry.ugfdid || entry.id || entry.fd_id || idx}
                entry={entry}
                colors={colors}
                isDark={isDark}
                index={idx}
                facultyList={facultyList}
              />
            ))}

            {!loading && entries.length === 0 && !showForm && (
              <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
                <MaterialIcons name="library-books" size={52} color={colors.textMuted} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>No Entries Yet</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 }}>
                  Use the form above to log your foundation course sessions.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Pickers */}
      <CalendarModal
        visible={showDatePicker}
        selectedDate={formDate}
        onSelect={setFormDate}
        onClose={() => setShowDatePicker(false)}
        colors={colors}
        isDark={isDark}
      />
      <TimePickerModal
        visible={showTimePicker}
        selectedTime={formTime}
        onSelect={setFormTime}
        onClose={() => setShowTimePicker(false)}
        colors={colors}
      />
      <FacultyPickerModal
        visible={showFacultyPicker}
        facultyList={facultyList}
        selectedId={formFacultyId}
        onSelect={(id, name) => { setFormFacultyId(id); setFormFacultyName(name); }}
        onClose={() => setShowFacultyPicker(false)}
        colors={colors}
        loading={facultyLoading}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  headerSubtitle: { fontSize: 12, marginTop: 1 },
  statsBanner: {
    borderRadius: 18, padding: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
  },
  statsDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.3)' },
  formCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5 },
  fieldLabel: { fontSize: 11, fontWeight: '700', marginBottom: 5 },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 12, height: 44,
  },
  textArea: {
    borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: '#7C3AED', height: 46, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', flexDirection: 'row',
  },
  cancelBtn: {
    borderWidth: 1.5, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  addBtn: {
    backgroundColor: '#7C3AED', height: 46, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6,
    borderWidth: 1.5, borderColor: '#6D28D9', marginBottom: 12,
  },
});

const entryStyles = StyleSheet.create({
  card: {
    borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderLeftWidth: 4,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
});

const calStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  monthLabel: { fontSize: 16, fontWeight: '800' },
});

const tpStyles = StyleSheet.create({
  arrow: { width: 44, height: 36, justifyContent: 'center', alignItems: 'center' },
  timeNum: { fontSize: 36, fontWeight: '900', width: 64, textAlign: 'center' },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: '#E5E7EB' },
});

export default FoundationLogbookScreen;
