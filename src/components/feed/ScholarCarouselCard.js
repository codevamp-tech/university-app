import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ── Theme Gradients & Accents ────────────────────────────────────────────────
const THEMES = {
  indigo: {
    gradient: ['#0F172A', '#1E1B4B', '#312E81'],
    accent: '#818CF8',
    badgeBg: 'rgba(129, 140, 248, 0.2)',
    badgeText: '#C7D2FE',
    cardBg: 'rgba(0, 0, 0, 0.25)',
    cardBorder: 'rgba(129, 140, 248, 0.3)',
    name: 'Tech & Systems',
  },
  violet: {
    gradient: ['#18002E', '#3B0764', '#581C87'],
    accent: '#C084FC',
    badgeBg: 'rgba(192, 132, 252, 0.2)',
    badgeText: '#E9D5FF',
    cardBg: 'rgba(0, 0, 0, 0.25)',
    cardBorder: 'rgba(192, 132, 252, 0.3)',
    name: 'AI & Data Science',
  },
  crimson: {
    gradient: ['#2B0411', '#500724', '#881337'],
    accent: '#FB7185',
    badgeBg: 'rgba(251, 113, 133, 0.2)',
    badgeText: '#FECDD3',
    cardBg: 'rgba(0, 0, 0, 0.25)',
    cardBorder: 'rgba(251, 113, 133, 0.3)',
    name: 'Engineering & Mech',
  },
  emerald: {
    gradient: ['#02241C', '#064E3B', '#047857'],
    accent: '#34D399',
    badgeBg: 'rgba(52, 211, 153, 0.2)',
    badgeText: '#A7F3D0',
    cardBg: 'rgba(0, 0, 0, 0.25)',
    cardBorder: 'rgba(52, 211, 153, 0.3)',
    name: 'Management & Biz',
  },
  amber: {
    gradient: ['#2E1303', '#5E2707', '#92400E'],
    accent: '#FBBF24',
    badgeBg: 'rgba(251, 191, 36, 0.2)',
    badgeText: '#FDE68A',
    cardBg: 'rgba(0, 0, 0, 0.25)',
    cardBorder: 'rgba(251, 191, 36, 0.3)',
    name: 'Innovation & Startups',
  },
  slate: {
    gradient: ['#0B0F19', '#1E293B', '#334155'],
    accent: '#38BDF8',
    badgeBg: 'rgba(56, 189, 248, 0.2)',
    badgeText: '#BAE6FD',
    cardBg: 'rgba(0, 0, 0, 0.25)',
    cardBorder: 'rgba(56, 189, 248, 0.3)',
    name: 'Research & Case Study',
  },
  ocean: {
    gradient: ['#082F49', '#0369A1', '#0284C7'],
    accent: '#38BDF8',
    badgeBg: 'rgba(56, 189, 248, 0.2)',
    badgeText: '#BAE6FD',
    cardBg: 'rgba(0, 0, 0, 0.25)',
    cardBorder: 'rgba(56, 189, 248, 0.3)',
    name: 'Cloud & DevOps',
  },
};

const THEME_KEYS = Object.keys(THEMES);

// ── Markdown Formatter (Bold **text** & Code `formula`) ──────────────────────
function formatInlineText(text = '', accentColor = '#818CF8') {
  if (!text) return null;

  // Split by inline code `...` and bold **...**
  const regex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (!part) return null;

    if (part.startsWith('`') && part.endsWith('`')) {
      const code = part.slice(1, -1);
      return (
        <Text
          key={i}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: '#FDE047',
            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
            fontWeight: '800',
            fontSize: 13,
          }}
        >
          {` ${code} `}
        </Text>
      );
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return (
        <Text
          key={i}
          style={{
            fontWeight: '800',
            color: '#FFFFFF',
          }}
        >
          {boldText}
        </Text>
      );
    }

    return (
      <Text key={i} style={{ color: 'rgba(255, 255, 255, 0.92)' }}>
        {part}
      </Text>
    );
  });
}

function renderStructuredBody(bodyText = '', accentColor = '#818CF8') {
  const lines = bodyText.split('\n');
  return (
    <View style={{ gap: 6 }}>
      {lines.map((l, idx) => {
        const trimmed = l.trim();
        if (!trimmed) return <View key={idx} style={{ height: 4 }} />;

        // Full formula / equation block wrapped in `...`
        const isFormulaLine = trimmed.startsWith('`') && trimmed.endsWith('`') && trimmed.length > 2;
        if (isFormulaLine) {
          const formula = trimmed.slice(1, -1);
          return (
            <View
              key={idx}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.16)',
                marginVertical: 4,
              }}
            >
              <Text
                style={{
                  color: '#FDE047',
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                  fontWeight: '700',
                  fontSize: 13,
                  lineHeight: 18,
                }}
              >
                {formula}
              </Text>
            </View>
          );
        }

        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || /^[0-9]+[️⃣\.]/.test(trimmed);

        return (
          <Text
            key={idx}
            style={{
              fontSize: 14,
              lineHeight: 22,
              color: 'rgba(255, 255, 255, 0.92)',
              paddingLeft: isBullet ? 4 : 0,
            }}
          >
            {formatInlineText(trimmed, accentColor)}
          </Text>
        );
      })}
    </View>
  );
}

// ── Smart Content Parser & Color Rotation ────────────────────────────────────
function parsePostIntoSlides(content = '', postId = '', defaultThemeKey = null, createdAt = null) {
  const raw = (content || '').trim();
  if (!raw) return { slides: [], themeKey: 'indigo' };

  // 1. Determine theme:
  let themeKey = defaultThemeKey;
  if (!themeKey) {
    if (createdAt) {
      try {
        const hour = new Date(createdAt).getHours();
        if (hour >= 5 && hour < 12) {
          // Morning post (5:00 AM - 11:59 AM) -> Systems & Deep Indigo
          themeKey = 'indigo';
        } else if (hour >= 12 && hour < 17) {
          // Afternoon post (12:00 PM - 4:59 PM) -> Engineering & Crimson Ruby
          themeKey = 'crimson';
        } else {
          // Evening post (5:00 PM onwards) -> AI/ML & Royal Violet
          themeKey = 'violet';
        }
      } catch {
        // fallback
      }
    }

    if (!themeKey) {
      const lower = raw.toLowerCase();
      if (lower.includes('mechanical') || lower.includes('civil') || lower.includes('fea') || lower.includes('fatigue') || lower.includes('hardware')) {
        themeKey = 'crimson';
      } else if (lower.includes('ai') || lower.includes('deep learning') || lower.includes('transformer') || lower.includes('model') || lower.includes('neural')) {
        themeKey = 'violet';
      } else if (lower.includes('finance') || lower.includes('accounting') || lower.includes('management') || lower.includes('mba') || lower.includes('cac') || lower.includes('ltv') || lower.includes('business')) {
        themeKey = 'emerald';
      } else if (lower.includes('startup') || lower.includes('venture') || lower.includes('pitch') || lower.includes('product')) {
        themeKey = 'amber';
      } else if (lower.includes('system design') || lower.includes('database') || lower.includes('hashing') || lower.includes('distributed') || lower.includes('algorithm')) {
        themeKey = 'indigo';
      } else {
        // Rotate colors deterministically across posts
        let hash = 0;
        const seed = String(postId || content);
        for (let i = 0; i < seed.length; i++) {
          hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }
        themeKey = THEME_KEYS[Math.abs(hash) % THEME_KEYS.length];
      }
    }
  }

  // 2. Check if explicitly split by `---` (Student Slide Break syntax)
  if (raw.includes('---')) {
    const rawSlides = raw.split(/\n\s*---\s*\n/).filter(s => s.trim().length > 0);
    if (rawSlides.length > 1) {
      const parsedSlides = rawSlides.map((s, idx) => {
        const lines = s.trim().split('\n').filter(l => l.trim().length > 0);
        const titleLine = (lines[0] || '').replace(/^#+\s*|\*\*|\*/g, '').trim() || `Slide ${idx + 1}`;
        const bodyText = lines.slice(1).join('\n').trim() || lines[0] || '';
        return {
          type: idx === 0 ? 'cover' : 'content',
          title: titleLine.replace(/\*\*/g, '').trim(),
          body: bodyText,
          slideNumber: idx + 1,
        };
      });
      return { slides: parsedSlides, themeKey };
    }
  }

  // 3. Intelligent sectioning for AI Scholar educational posts
  const lines = raw.split('\n');
  let firstHeader = '';
  let introLines = [];
  let sections = [];
  let currentSection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const isHeader = /^([💡⚙️🧠⚡🚗🚀📈📊🔬🎯🔍📝✨][^\n]*|\*\*[^\n]+\*\*|#+\s+[^\n]+)/.test(line);

    if (isHeader) {
      const cleanH = line.replace(/^\*\*|\*\*$/g, '').replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
      if (!firstHeader) {
        firstHeader = cleanH;
      } else {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          header: cleanH,
          lines: [],
        };
      }
    } else {
      if (currentSection) {
        currentSection.lines.push(line);
      } else {
        introLines.push(line);
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  const slides = [];

  // Slide 1: Cover Slide
  const coverTitle = (firstHeader || 'Concept Deep Dive').replace(/\*\*/g, '').trim();
  const coverIntro = introLines.slice(0, 3).join('\n') || 'Swipe through this interactive slide deck for a breakdown of key concepts and architecture.';
  slides.push({
    type: 'cover',
    title: coverTitle,
    body: coverIntro,
    slideNumber: 1,
  });

  // Slide 2..N: Section Slides
  if (sections.length > 0) {
    sections.forEach((sec, idx) => {
      slides.push({
        type: 'content',
        title: sec.header.replace(/\*\*/g, '').trim(),
        body: sec.lines.join('\n'),
        slideNumber: idx + 2,
      });
    });
  } else if (introLines.length > 3) {
    const chunkSize = Math.ceil(introLines.length / 2);
    for (let i = 0; i < introLines.length; i += chunkSize) {
      slides.push({
        type: 'content',
        title: `Key Concepts (Part ${Math.floor(i / chunkSize) + 1})`,
        body: introLines.slice(i, i + chunkSize).join('\n'),
        slideNumber: slides.length + 1,
      });
    }
  }

  return { slides: slides.length > 0 ? slides : [{ type: 'cover', title: 'Concept Bite', body: raw, slideNumber: 1 }], themeKey };
}

// ── Main ScholarCarouselCard Component ───────────────────────────────────────
function ScholarCarouselCardComponent({
  post,
  colors = {},
  isDarkTheme = false,
  onOpenFullscreen,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [showFullTextView, setShowFullTextView] = useState(false);
  const flatListRef = useRef(null);

  const cardWidth = width - 32;
  const cardHeight = Math.round(cardWidth * 1.18);

  const content = post?.content || '';
  const postId = post?.id || '';
  let postTheme = post?.carousel_theme || post?.theme || null;
  if (!postTheme && Array.isArray(post?.tags)) {
    const themeTag = post.tags.find(
      t => typeof t === 'string' && (t.startsWith('#theme_') || THEME_KEYS.includes(t.replace(/^#/, '')))
    );
    if (themeTag) {
      postTheme = themeTag.replace(/^#theme_|^#/, '');
    }
  }
  const createdAt = post?.created_at || null;

  const { slides, themeKey } = useMemo(() => {
    return parsePostIntoSlides(content, postId, postTheme, createdAt);
  }, [content, postId, postTheme, createdAt]);

  const activeTheme = THEMES[themeKey] || THEMES.indigo;
  const totalPages = slides.length;

  const handleScroll = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / cardWidth) + 1;
    if (pageIndex >= 1 && pageIndex <= totalPages) {
      setCurrentPage(pageIndex);
    }
  };

  const goToPage = (pageIdx) => {
    if (pageIdx >= 0 && pageIdx < totalPages && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: pageIdx, animated: true });
      setCurrentPage(pageIdx + 1);
    }
  };

  const isSlideDeckExplicit = Boolean(
    post?.is_carousel ||
    post?.post_type === 'carousel' ||
    (Array.isArray(post?.tags) && post.tags.some(t => typeof t === 'string' && (t.includes('slidedeck') || t.includes('carousel'))))
  );

  if (showFullTextView || (totalPages <= 1 && !isSlideDeckExplicit)) {
    return (
      <View style={{ marginTop: 6, marginBottom: 12 }}>
        <Text style={{ fontSize: 15, lineHeight: 22, color: colors.textPrimary || '#1E293B' }}>
          {content}
        </Text>
        {totalPages > 1 && (
          <TouchableOpacity
            style={[styles.viewToggleBtn, { backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.08)' : '#EEF2FF' }]}
            onPress={() => setShowFullTextView(false)}
          >
            <MaterialCommunityIcons name="cards-outline" size={16} color={activeTheme.accent} />
            <Text style={[styles.viewToggleText, { color: activeTheme.accent }]}>Switch to Slide Deck 🎴</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      {/* Single LinearGradient Card Deck Wrap for maximal GPU performance */}
      <LinearGradient
        colors={activeTheme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.cardContainer,
          {
            width: cardWidth,
            height: cardHeight,
            borderColor: activeTheme.cardBorder,
          },
        ]}
      >
        {/* Subtle Vignette Texture Overlay */}
        <View style={styles.vignetteOverlay} />

        {/* Swipeable FlatList of Slides */}
        <FlatList
          ref={flatListRef}
          data={slides}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          getItemLayout={(_, index) => ({ length: cardWidth, offset: cardWidth * index, index })}
          renderItem={({ item, index }) => (
            <View style={[styles.slideCanvas, { width: cardWidth, height: cardHeight }]}>
              {/* ── Slide Header ── */}
              <View style={styles.slideHeader}>
                <View style={[styles.topicBadge, { backgroundColor: activeTheme.badgeBg }]}>
                  <Text style={[styles.topicBadgeText, { color: activeTheme.badgeText }]}>
                    {activeTheme.name.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.counterPill}>
                  <Text style={styles.counterPillText}>
                    {index + 1} / {totalPages}
                  </Text>
                </View>
              </View>

              {/* ── Slide Body ── */}
              <View style={styles.slideContentContainer}>
                {item.type === 'cover' ? (
                  <View style={styles.coverSlideWrap}>
                    <View style={[styles.coverIconGlow, { backgroundColor: activeTheme.badgeBg }]}>
                      <MaterialCommunityIcons name="lightning-bolt" size={32} color={activeTheme.accent} />
                    </View>

                    <Text style={styles.coverTitleText} numberOfLines={4}>
                      {item.title}
                    </Text>

                    <View style={[styles.accentDivider, { backgroundColor: activeTheme.accent }]} />

                    <View style={{ width: '100%' }}>
                      {renderStructuredBody(item.body, activeTheme.accent)}
                    </View>

                    <View style={styles.swipeHintWrap}>
                      <Text style={[styles.swipeHintText, { color: activeTheme.badgeText }]}>
                        Swipe to explore breakdown
                      </Text>
                      <Feather name="arrow-right" size={16} color={activeTheme.accent} />
                    </View>
                  </View>
                ) : (
                  <View style={styles.contentSlideWrap}>
                    <Text style={[styles.contentTitleText, { color: activeTheme.accent }]} numberOfLines={2}>
                      {item.title}
                    </Text>

                    <View style={[styles.accentDividerShort, { backgroundColor: activeTheme.accent }]} />

                    <View style={[styles.contentGlassCard, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.cardBorder }]}>
                      {renderStructuredBody(item.body, activeTheme.accent)}
                    </View>
                  </View>
                )}
              </View>

              {/* ── Slide Footer / Bottom Navigation Controls ── */}
              <View style={styles.slideFooter}>
                <TouchableOpacity
                  style={[
                    styles.bottomNavBtn,
                    { opacity: index > 0 ? 1 : 0.25 }
                  ]}
                  onPress={() => index > 0 && goToPage(index - 1)}
                  disabled={index === 0}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.dotsRow}>
                  {slides.map((_, dotIdx) => (
                    <TouchableOpacity
                      key={dotIdx}
                      onPress={() => goToPage(dotIdx)}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <View
                        style={[
                          styles.dot,
                          dotIdx === index
                            ? [styles.activeDot, { backgroundColor: activeTheme.accent, width: 18 }]
                            : styles.inactiveDot,
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.bottomNavBtn,
                    { opacity: index < totalPages - 1 ? 1 : 0.25 }
                  ]}
                  onPress={() => index < totalPages - 1 && goToPage(index + 1)}
                  disabled={index === totalPages - 1}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </LinearGradient>

      {/* Bottom Switcher: Card Deck ↔ Article Text */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.viewToggleBtn, { backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]}
          onPress={() => setShowFullTextView(true)}
          activeOpacity={0.7}
        >
          <Feather name="file-text" size={14} color={colors.textSecondary || '#64748B'} />
          <Text style={[styles.viewToggleText, { color: colors.textSecondary || '#64748B' }]}>Read Full Article 📝</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const ScholarCarouselCard = React.memo(ScholarCarouselCardComponent);

const styles = StyleSheet.create({
  outerContainer: {
    marginTop: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  cardContainer: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  slideCanvas: {
    padding: 18,
    justifyContent: 'space-between',
    position: 'relative',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.14)',
  },
  slideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
    marginBottom: 8,
  },
  topicBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  topicBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  counterPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  slideContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 6,
    zIndex: 2,
  },
  coverSlideWrap: {
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  coverIconGlow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  coverTitleText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 27,
    letterSpacing: -0.3,
  },
  accentDivider: {
    width: 48,
    height: 3,
    borderRadius: 2,
    marginVertical: 12,
  },
  swipeHintWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  swipeHintText: {
    fontSize: 12,
    fontWeight: '700',
  },
  contentSlideWrap: {
    paddingHorizontal: 2,
  },
  contentTitleText: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  accentDividerShort: {
    width: 36,
    height: 3,
    borderRadius: 2,
    marginVertical: 10,
  },
  contentGlassCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginTop: 4,
  },
  slideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 4,
    zIndex: 2,
  },
  bottomNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 18,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  bottomBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  viewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: 'flex-end',
  },
  viewToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
