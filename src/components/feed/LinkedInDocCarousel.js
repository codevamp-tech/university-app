import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

const { width } = Dimensions.get('window');

// ── Slide Page Subcomponent with Image & Fallback Canvas ─────────────────────
const DocPageSlide = ({
  item,
  docCardWidth,
  docCardHeight,
  cleanName,
  totalPages,
  isDarkTheme,
  themeColors,
  onOpenReader,
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onOpenReader}
      style={[
        styles.docPageContainer,
        {
          width: docCardWidth,
          height: docCardHeight,
          backgroundColor: isDarkTheme ? '#1E293B' : '#F8FAFC',
        },
      ]}
    >
      {/* Rasterized page image if available */}
      {!imgError && item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={[
            styles.docPageImage,
            {
              width: docCardWidth,
              height: docCardHeight,
              backgroundColor: isDarkTheme ? '#1E293B' : '#FFFFFF',
            },
          ]}
          resizeMode="contain"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
        />
      ) : null}

      {/* Fallback slide card displayed when image is loading or unavailable */}
      {(!imgLoaded || imgError || !item.imageUrl) && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isDarkTheme ? '#1E293B' : '#F1F5F9',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              width: '90%',
              backgroundColor: isDarkTheme ? '#0F172A' : '#FFFFFF',
              borderRadius: 18,
              padding: 22,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: isDarkTheme ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#FEE2E2',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <MaterialCommunityIcons name="file-pdf-box" size={38} color="#E53E3E" />
            </View>

            <Text
              style={{
                fontSize: 15,
                fontWeight: '800',
                color: themeColors?.textPrimary || '#1E293B',
                textAlign: 'center',
              }}
              numberOfLines={2}
            >
              {cleanName}
            </Text>

            <Text
              style={{
                fontSize: 12,
                color: themeColors?.textSecondary || '#64748B',
                textAlign: 'center',
                marginTop: 4,
                fontWeight: '600',
              }}
            >
              Slide {item.pageNum} of {totalPages} • PDF Presentation
            </Text>

            <View
              style={{
                marginTop: 16,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#4F46E5',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                gap: 8,
              }}
            >
              <Feather name="book-open" size={16} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                Read Full Document
              </Text>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ── Main LinkedInDocCarousel Component ───────────────────────────────────────
export function LinkedInDocCarousel({ doc, isDarkTheme = false, themeColors = {}, onOpenFullscreen }) {
  const [currentPage, setCurrentPage] = useState(1);
  const flatListRef = useRef(null);

  const docCardWidth = width - 32;
  const docCardHeight = Math.round(docCardWidth * 1.15); // Standard 4:5 document aspect ratio

  const normalizedDoc = typeof doc === 'string'
    ? { url: doc, name: doc.split('/').pop()?.split('?')[0] || 'Document.pdf', pageCount: 1, pageUrls: [] }
    : (doc || {});

  const cleanName = (normalizedDoc.name || 'Document.pdf').replace(/\.pdf\.pdf$/i, '.pdf');
  const cleanUrl = (normalizedDoc.url || normalizedDoc.uri || '').replace(/\.pdf\.pdf$/i, '.pdf');

  const getCloudinaryPageUrl = (url, page) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    const transformed = url.replace(/\/image\/upload\/(v\d+\/)?/i, `/image/upload/pg_${page},w_1080,f_jpg,q_auto/`);
    return transformed.replace(/\.pdf$/i, '.jpg');
  };

  const hasImagePages = normalizedDoc.pageUrls && normalizedDoc.pageUrls.length > 0 && normalizedDoc.pageUrls.some(u => !u.endsWith('.pdf'));
  const isCarouselDoc = cleanName.toLowerCase().includes('carousel') || 
                        cleanName.toLowerCase().includes('deck') || 
                        cleanName.toLowerCase().includes('slide') || 
                        cleanName.toLowerCase().includes('agent');
  const derivedPageCount = normalizedDoc.pageCount || normalizedDoc.pages || (normalizedDoc.pageUrls && normalizedDoc.pageUrls.length) || (isCarouselDoc ? 5 : 1);
  const totalPages = Math.max(1, derivedPageCount);

  const pageItems = Array.from({ length: totalPages }, (_, i) => {
    const pageNum = i + 1;
    let imageUrl = null;
    if (hasImagePages && normalizedDoc.pageUrls[i]) {
      imageUrl = normalizedDoc.pageUrls[i];
    } else if (cleanUrl.includes('cloudinary.com')) {
      imageUrl = getCloudinaryPageUrl(cleanUrl, pageNum);
    }
    return {
      pageNum,
      imageUrl,
    };
  });

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleScroll = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / docCardWidth) + 1;
    if (pageIndex >= 1 && pageIndex <= pageItems.length) {
      setCurrentPage(pageIndex);
    }
  };

  const goToPage = (pageIdx) => {
    if (pageIdx >= 0 && pageIdx < pageItems.length && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: pageIdx, animated: true });
      setCurrentPage(pageIdx + 1);
    }
  };

  const handleOpenExternalBrowser = async () => {
    if (!cleanUrl) return;
    try {
      const viewerUrl = cleanUrl.endsWith('.pdf')
        ? `https://docs.google.com/viewer?url=${encodeURIComponent(cleanUrl)}`
        : cleanUrl;
      await WebBrowser.openBrowserAsync(viewerUrl);
    } catch (_) {
      try {
        await WebBrowser.openBrowserAsync(cleanUrl);
      } catch (e) {
        if (onOpenFullscreen) onOpenFullscreen(normalizedDoc, currentPage - 1);
      }
    }
  };

  const handleOpenDocumentReader = () => {
    if (onOpenFullscreen) {
      onOpenFullscreen(normalizedDoc, currentPage - 1);
    } else {
      handleOpenExternalBrowser();
    }
  };

  return (
    <View
      style={[
        styles.docCarouselCard,
        {
          backgroundColor: isDarkTheme ? '#1E293B' : '#FFFFFF',
          borderColor: isDarkTheme ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
        },
      ]}
    >
      {/* Top Header inside card — Title and page count */}
      <View
        style={[
          styles.docHeaderBar,
          {
            borderBottomColor: isDarkTheme ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
            backgroundColor: isDarkTheme ? '#1E293B' : '#FFFFFF',
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleOpenDocumentReader}
          style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="file-pdf-box" size={26} color="#E53E3E" />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: themeColors?.textPrimary || '#1E293B',
              }}
              numberOfLines={1}
            >
              {cleanName}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: themeColors?.textSecondary || '#64748B',
                marginTop: 1,
              }}
            >
              {totalPages} {totalPages === 1 ? 'page' : 'pages'}{' '}
              {normalizedDoc.size > 0 ? `· ${formatSize(normalizedDoc.size)}` : ''}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleOpenExternalBrowser}
          style={[
            styles.docFullscreenPill,
            { backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.08)' : '#F1F5F9' },
          ]}
          activeOpacity={0.7}
        >
          <Feather name="external-link" size={16} color={themeColors?.textPrimary || '#1E293B'} />
        </TouchableOpacity>
      </View>

      {/* Swipeable Document Carousel Area */}
      <View
        style={{
          position: 'relative',
          width: docCardWidth,
          height: docCardHeight,
          backgroundColor: isDarkTheme ? '#1E293B' : '#F8FAFC',
        }}
      >
        {/* Floating Page Badge */}
        {pageItems.length > 1 && (
          <View style={styles.docBadgePill}>
            <Text style={styles.docBadgeText}>
              {currentPage} / {pageItems.length}
            </Text>
          </View>
        )}

        {/* Left Arrow Button */}
        {currentPage > 1 && (
          <TouchableOpacity
            style={[styles.docNavArrow, styles.docNavArrowLeft]}
            onPress={() => goToPage(currentPage - 2)}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Right Arrow Button */}
        {currentPage < pageItems.length && (
          <TouchableOpacity
            style={[styles.docNavArrow, styles.docNavArrowRight]}
            onPress={() => goToPage(currentPage)}
          >
            <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Horizontal FlatList for pages */}
        <FlatList
          ref={flatListRef}
          data={pageItems}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          getItemLayout={(_, index) => ({
            length: docCardWidth,
            offset: docCardWidth * index,
            index,
          })}
          renderItem={({ item }) => (
            <DocPageSlide
              item={item}
              docCardWidth={docCardWidth}
              docCardHeight={docCardHeight}
              cleanName={cleanName}
              totalPages={totalPages}
              isDarkTheme={isDarkTheme}
              themeColors={themeColors}
              onOpenReader={handleOpenDocumentReader}
            />
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  docCarouselCard: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  docHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  docFullscreenPill: {
    padding: 6,
    borderRadius: 8,
  },
  docPageContainer: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  docPageImage: {
    backgroundColor: '#FFFFFF',
  },
  docBadgePill: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  docBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  docNavArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  docNavArrowLeft: {
    left: 10,
  },
  docNavArrowRight: {
    right: 10,
  },
});

export default LinkedInDocCarousel;
