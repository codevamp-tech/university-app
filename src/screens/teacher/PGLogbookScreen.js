import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, FlatList, Animated, Easing,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../context/UserContext';
import { getPGSchedulerAPI } from '../../data/apiService';

const { width, height } = Dimensions.get('window');

const PG_CATEGORIES = [
  {
    id: 'AcademicList', title: 'Academic List',
    icon: 'school-outline', color: '#7C3AED', bgColor: '#F5F3FF',
    items: [
      { id: 'AL1', title: 'Didactic Lecture', description: 'Formal lecture sessions on core PG topics' },
      { id: 'AL2', title: 'Seminar', description: 'Student-led topic presentations' },
      { id: 'AL3', title: 'Journal Club', description: 'Review and discussion of recent research papers' },
      { id: 'AL4', title: 'Case Presentation', description: 'Clinical case discussion and analysis' },
      { id: 'AL5', title: 'CME / Conference', description: 'Continuing medical education and conferences attended' },
      { id: 'AL6', title: 'Group Discussion', description: 'Structured academic group discussions' },
    ],
  },
  {
    id: 'ClinicalList', title: 'Clinical List',
    icon: 'medical-outline', color: '#DC2626', bgColor: '#FEF2F2',
    items: [
      { id: 'CL1', title: 'Case Write-up', description: 'Detailed written documentation of clinical cases' },
      { id: 'CL2', title: 'Bedside Clinic', description: 'Bedside teaching and examination of patients' },
      { id: 'CL3', title: 'OPD Posting', description: 'Outpatient department clinical posting' },
      { id: 'CL4', title: 'Ward Rounds', description: 'In-patient ward rounds with senior faculty' },
      { id: 'CL5', title: 'Procedure Log', description: 'Record of clinical procedures performed' },
      { id: 'CL6', title: 'Emergency Posting', description: 'Emergency department postings and case management' },
    ],
  },
  {
    id: 'AdditionalList', title: 'Additional List',
    icon: 'add-circle-outline', color: '#D97706', bgColor: '#FFFBEB',
    items: [
      { id: 'ADL1', title: 'Research Work', description: 'Ongoing or completed research activities' },
      { id: 'ADL2', title: 'Publication', description: 'Research papers authored or co-authored' },
      { id: 'ADL3', title: 'Thesis Progress', description: 'Thesis chapter completion milestones' },
      { id: 'ADL4', title: 'Community Posting', description: 'Community health center postings' },
      { id: 'ADL5', title: 'Teaching UG', description: 'Contribution to UG teaching activities' },
    ],
  },
  {
    id: 'MandatoryTraining', title: 'Mandatory Training List',
    icon: 'shield-checkmark-outline', color: '#0284C7', bgColor: '#F0F9FF',
    items: [
      { id: 'MT1', title: 'BLS / ACLS Training', description: 'Basic & Advanced Cardiac Life Support' },
      { id: 'MT2', title: 'Basic Surgical Skills', description: 'Knot tying, suturing, and instrument handling' },
      { id: 'MT3', title: 'Bioethics Session', description: 'Medical ethics and professionalism training' },
      { id: 'MT4', title: 'POSH Training', description: 'Prevention of Sexual Harassment awareness' },
      { id: 'MT5', title: 'Infection Control', description: 'Hand hygiene and infection prevention' },
    ],
  },
  {
    id: 'Microbiology', title: 'Microbiology',
    icon: 'flask-outline', color: '#059669', bgColor: '#ECFDF5',
    items: [
      { id: 'MB1', title: 'Lab Demonstration', description: 'Microbiological lab techniques and demonstrations' },
      { id: 'MB2', title: 'Culture & Sensitivity', description: 'C&S reporting and interpretation sessions' },
      { id: 'MB3', title: 'Microscopy', description: 'Slide preparation and microscopy practice' },
      { id: 'MB4', title: 'Case-Based Learning', description: 'Microbiology-focused case discussions' },
    ],
  },
  {
    id: 'Pathology', title: 'Pathology',
    icon: 'eyedrop-outline', color: '#7C3AED', bgColor: '#F5F3FF',
    items: [
      { id: 'PA1', title: 'Histopathology', description: 'Tissue biopsy slide interpretation' },
      { id: 'PA2', title: 'Cytopathology', description: 'Fine needle aspiration and cytological studies' },
      { id: 'PA3', title: 'Autopsy Participation', description: 'Medico-legal autopsy observation and reporting' },
      { id: 'PA4', title: 'Lab Report Review', description: 'Pathology report analysis sessions' },
    ],
  },
  {
    id: 'Pediatrics', title: 'Department of Pediatrics',
    icon: 'people-outline', color: '#EC4899', bgColor: '#FDF2F8',
    items: [
      { id: 'PED1', title: 'Neonatal Case', description: 'Neonatal examination and case management' },
      { id: 'PED2', title: 'Growth Assessment', description: 'Pediatric anthropometry and growth charting' },
      { id: 'PED3', title: 'Immunization Clinic', description: 'Vaccine administration and counseling' },
      { id: 'PED4', title: 'Pediatric Emergency', description: 'Emergency pediatric management cases' },
      { id: 'PED5', title: 'Neonatal Resuscitation', description: 'NRP training and clinical application' },
    ],
  },
  {
    id: 'AnatomyActivities', title: 'Anatomy Academic Activities',
    icon: 'body-outline', color: '#EA580C', bgColor: '#FFF7ED',
    items: [
      { id: 'AA1', title: 'Dissection Session', description: 'Cadaveric dissection and anatomical studies' },
      { id: 'AA2', title: 'Surface Anatomy', description: 'Surface markings and clinical correlations' },
      { id: 'AA3', title: 'Radiological Anatomy', description: 'Imaging interpretation for anatomical structures' },
      { id: 'AA4', title: 'Embryology Session', description: 'Developmental anatomy lectures and seminars' },
    ],
  },
  {
    id: 'Physiology', title: 'Physiology',
    icon: 'heart-outline', color: '#EF4444', bgColor: '#FEF2F2',
    items: [
      { id: 'PHY1', title: 'Practical Demonstration', description: 'Physiology lab practical and demonstrations' },
      { id: 'PHY2', title: 'Research Review', description: 'Review of current physiological research' },
      { id: 'PHY3', title: 'Clinical Correlation', description: 'Linking physiology concepts to clinical cases' },
      { id: 'PHY4', title: 'Instrument Training', description: 'Hands-on training with physiological instruments' },
    ],
  },
  {
    id: 'Pharmacology', title: 'Pharmacology',
    icon: 'tablets-outline', color: '#2563EB', bgColor: '#EFF6FF',
    items: [
      { id: 'PHAR1', title: 'Drug Chart Review', description: 'Review and analysis of patient drug charts' },
      { id: 'PHAR2', title: 'Drug Interaction Session', description: 'Clinically significant drug interactions' },
      { id: 'PHAR3', title: 'Clinical Pharmacology Case', description: 'Pharmacological management of cases' },
      { id: 'PHAR4', title: 'ADR Reporting', description: 'Adverse drug reaction documentation and reporting' },
    ],
  },
  {
    id: 'Radiology', title: 'Radiology',
    icon: 'scan-outline', color: '#0891B2', bgColor: '#ECFEFF',
    items: [
      { id: 'RAD1', title: 'X-Ray Reporting', description: 'Plain radiograph interpretation and reporting' },
      { id: 'RAD2', title: 'CT Interpretation', description: 'CT scan analysis and structured reporting' },
      { id: 'RAD3', title: 'USG Guided Procedure', description: 'Ultrasound-guided diagnostic/therapeutic procedures' },
      { id: 'RAD4', title: 'MRI Review', description: 'MRI sequence interpretation and correlation' },
    ],
  },
  {
    id: 'DRP', title: 'DRP',
    icon: 'document-text-outline', color: '#7C3AED', bgColor: '#F5F3FF',
    items: [
      { id: 'DRP1', title: 'Drug Regulatory Affairs', description: 'Overview of drug regulatory frameworks' },
      { id: 'DRP2', title: 'Pharmacovigilance', description: 'Post-marketing drug surveillance and monitoring' },
      { id: 'DRP3', title: 'ADR Reporting', description: 'Systematic adverse reaction reporting' },
      { id: 'DRP4', title: 'Clinical Trial Protocol', description: 'Understanding and reviewing clinical trials' },
    ],
  },
  {
    id: 'Anaesthesia', title: 'Anaesthesia',
    icon: 'medkit-outline', color: '#059669', bgColor: '#ECFDF5',
    items: [
      { id: 'AN1', title: 'Pre-op Assessment', description: 'Pre-operative patient evaluation and risk stratification' },
      { id: 'AN2', title: 'Intubation Log', description: 'Endotracheal intubation cases performed' },
      { id: 'AN3', title: 'Epidural / Spinal', description: 'Regional anaesthesia procedures completed' },
      { id: 'AN4', title: 'ICU Posting', description: 'Intensive care unit clinical rotation' },
      { id: 'AN5', title: 'Pain Management', description: 'Acute and chronic pain management cases' },
    ],
  },
];

const AccordionItem = ({ category, onSelectItem }) => {
  const [expanded, setExpanded] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.timing(animation, {
      toValue: expanded ? 0 : 1,
      duration: 250,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
    setExpanded(prev => !prev);
  };

  const maxHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, category.items.length * 68],
  });

  const rotate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={accStyles.container}>
      <TouchableOpacity style={accStyles.header} onPress={toggle} activeOpacity={0.8}>
        <View style={[accStyles.iconBg, { backgroundColor: category.bgColor }]}>
          <Ionicons name={category.icon} size={18} color={category.color} />
        </View>
        <Text style={accStyles.title}>{category.title}</Text>
        <View style={accStyles.countBadge}>
          <Text style={accStyles.countText}>{category.items.length}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={18} color="#6B7280" />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={[accStyles.body, { maxHeight }]}>
        {category.items.map((item, idx) => (
          <TouchableOpacity
            key={item.id}
            style={[accStyles.subItem, idx === category.items.length - 1 && { borderBottomWidth: 0 }]}
            onPress={() => onSelectItem(category, item)}
            activeOpacity={0.7}
          >
            <View style={[accStyles.dot, { backgroundColor: category.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={accStyles.subItemTitle}>{item.title}</Text>
              <Text style={accStyles.subItemDesc} numberOfLines={1}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
};

const EventCard = ({ event }) => (
  <View style={evStyles.card}>
    <View style={evStyles.typeBadge}>
      <Text style={evStyles.typeText}>{event.event_name}</Text>
    </View>
    <Text style={evStyles.topic} numberOfLines={2}>{event.topic_name}</Text>
    {event.from_date ? (
      <View style={evStyles.dateRow}>
        <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.6)" />
        <Text style={evStyles.dateText}>
          {event.from_date}{event.to_date && event.to_date !== event.from_date ? ` - ${event.to_date}` : ''}
        </Text>
      </View>
    ) : null}
  </View>
);

const PGLogbookScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, accessToken } = useUser();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const dept = user?.department || user?.dept || 'MCA';

  const fetchScheduler = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await getPGSchedulerAPI(accessToken, dept);
      setEvents(data?.events || []);
    } catch (e) {
      console.warn('[PGLogbook] fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [accessToken, dept]);

  useEffect(() => { fetchScheduler(); }, [fetchScheduler]);

  const closeModal = () => { setShowModal(false); setSelectedItem(null); };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#FFFFFF', '#F0FDF4']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={styles.backBtnBg}>
            <Ionicons name="arrow-back" size={20} color="#059669" />
          </LinearGradient>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>PG Logbook</Text>
          <Text style={styles.headerSub}>Postgraduate Academic Scheduler</Text>
        </View>
        <TouchableOpacity onPress={fetchScheduler} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color="#059669" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* PG Scheduler Card */}
        <LinearGradient colors={['#059669', '#047857']} style={styles.schedulerCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.cardTop}>
            <View>
              <Text style={styles.cardLabel}>PG SCHEDULER</Text>
              <Text style={styles.cardDept}>Dept: {dept}</Text>
            </View>
            <View style={styles.cardIconBg}>
              <MaterialCommunityIcons name="calendar-clock" size={28} color="#fff" />
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.loadingText}>Loading schedule…</Text>
            </View>
          ) : events.length === 0 ? (
            <View style={styles.emptyRow}>
              <Ionicons name="calendar-outline" size={22} color="rgba(255,255,255,0.6)" />
              <Text style={styles.emptyText}>No upcoming events for this department</Text>
            </View>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
                {events.map((ev, i) => <EventCard key={i} event={ev} />)}
              </ScrollView>
              <Text style={styles.evCount}>{events.length} upcoming event{events.length !== 1 ? 's' : ''}</Text>
            </>
          )}

          <TouchableOpacity style={styles.openBtn} onPress={() => setShowModal(true)} activeOpacity={0.85}>
            <Ionicons name="list-outline" size={18} color="#059669" style={{ marginRight: 6 }} />
            <Text style={styles.openBtnText}>Open Events</Text>
            <Ionicons name="chevron-forward" size={16} color="#059669" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color="#0284C7" />
          <Text style={styles.infoText}>
            PG students use the faculty login. Tap "Open Events" to browse all activity categories.
          </Text>
        </View>

        {/* Category Grid */}
        <Text style={styles.sectionTitle}>Activity Categories</Text>
        <View style={styles.grid}>
          {PG_CATEGORIES.map(cat => (
            <TouchableOpacity key={cat.id} style={styles.tile} onPress={() => setShowModal(true)} activeOpacity={0.8}>
              <View style={[styles.tileIcon, { backgroundColor: cat.bgColor }]}>
                <Ionicons name={cat.icon} size={20} color={cat.color} />
              </View>
              <Text style={styles.tileLabel} numberOfLines={2}>{cat.title}</Text>
              <Text style={styles.tileCount}>{cat.items.length} items</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Events Bottom Sheet Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={mStyles.overlay}>
          <TouchableOpacity style={mStyles.backdrop} activeOpacity={1} onPress={closeModal} />
          <View style={[mStyles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={mStyles.handle} />

            {selectedItem ? (
              <>
                <View style={mStyles.detailHeader}>
                  <TouchableOpacity onPress={() => setSelectedItem(null)} style={mStyles.backArrow}>
                    <Ionicons name="arrow-back" size={20} color="#374151" />
                  </TouchableOpacity>
                  <Text style={mStyles.sheetTitle} numberOfLines={1}>{selectedItem.item.title}</Text>
                </View>
                <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
                  <View style={[mStyles.catBadge, { backgroundColor: selectedItem.category.bgColor }]}>
                    <Ionicons name={selectedItem.category.icon} size={16} color={selectedItem.category.color} />
                    <Text style={[mStyles.catBadgeText, { color: selectedItem.category.color }]}>{selectedItem.category.title}</Text>
                  </View>
                  <View style={mStyles.detailCard}>
                    <Text style={mStyles.detailLabel}>DESCRIPTION</Text>
                    <Text style={mStyles.detailText}>{selectedItem.item.description}</Text>
                  </View>
                  <View style={mStyles.detailCard}>
                    <Text style={mStyles.detailLabel}>ACTIVITY ID</Text>
                    <Text style={mStyles.detailText}>{selectedItem.item.id}</Text>
                  </View>
                  <View style={mStyles.infoNote}>
                    <Ionicons name="information-circle-outline" size={16} color="#0284C7" />
                    <Text style={mStyles.infoNoteText}>
                      This activity is logged in the ERP portal under the PG MBBS logbook module. Contact your department coordinator to submit or verify entries.
                    </Text>
                  </View>
                </ScrollView>
              </>
            ) : (
              <>
                <View style={mStyles.sheetHeader}>
                  <View>
                    <Text style={mStyles.sheetTitle}>PG Logbook Events</Text>
                    <Text style={mStyles.sheetSub}>{PG_CATEGORIES.length} categories  •  Tap to expand</Text>
                  </View>
                  <TouchableOpacity onPress={closeModal} style={mStyles.closeBtn}>
                    <Ionicons name="close" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={PG_CATEGORIES}
                  keyExtractor={c => c.id}
                  contentContainerStyle={{ padding: 16, gap: 10 }}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item: cat }) => (
                    <AccordionItem
                      category={cat}
                      onSelectItem={(c, itm) => setSelectedItem({ category: c, item: itm })}
                    />
                  )}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  backBtnBg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827', letterSpacing: -0.4 },
  headerSub: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginTop: 1 },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, gap: 20, paddingBottom: 40 },
  schedulerCard: { borderRadius: 24, padding: 20, shadowColor: '#059669', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 1 },
  cardDept: { fontSize: 16, color: '#FFFFFF', fontWeight: '900', marginTop: 2 },
  cardIconBg: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  loadingText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  emptyRow: { alignItems: 'center', gap: 6, paddingVertical: 12, marginBottom: 8 },
  emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  evCount: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', marginBottom: 12 },
  openBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 12, marginTop: 4 },
  openBtnText: { fontSize: 14, fontWeight: '800', color: '#059669' },
  infoBanner: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: '#EFF6FF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#BFDBFE' },
  infoText: { flex: 1, fontSize: 12, color: '#1D4ED8', fontWeight: '600', lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: (width - 60) / 3, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  tileIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tileLabel: { fontSize: 10, fontWeight: '800', color: '#374151', textAlign: 'center', lineHeight: 13 },
  tileCount: { fontSize: 9, color: '#9CA3AF', fontWeight: '700', marginTop: 3 },
});

const evStyles = StyleSheet.create({
  card: { width: 160, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  typeBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 },
  typeText: { fontSize: 9, color: '#FFFFFF', fontWeight: '800', letterSpacing: 0.5 },
  topic: { fontSize: 12, color: '#FFFFFF', fontWeight: '700', lineHeight: 16, marginBottom: 8 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
});

const accStyles = StyleSheet.create({
  container: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#FFFFFF' },
  iconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 13, fontWeight: '800', color: '#111827' },
  countBadge: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6 },
  countText: { fontSize: 11, color: '#6B7280', fontWeight: '800' },
  body: { overflow: 'hidden', backgroundColor: '#FAFAFA' },
  subItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  subItemTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 2 },
  subItemDesc: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
});

const mStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: height * 0.88, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 20 },
  handle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  sheetTitle: { fontSize: 18, fontWeight: '900', color: '#111827', letterSpacing: -0.4 },
  sheetSub: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backArrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  catBadgeText: { fontSize: 12, fontWeight: '800' },
  detailCard: { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#F3F4F6' },
  detailLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  detailText: { fontSize: 14, color: '#374151', fontWeight: '600', lineHeight: 20 },
  infoNote: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#BFDBFE' },
  infoNoteText: { flex: 1, fontSize: 12, color: '#1D4ED8', fontWeight: '600', lineHeight: 18 },
});

export default PGLogbookScreen;
