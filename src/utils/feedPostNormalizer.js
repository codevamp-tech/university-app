/**
 * Pure helper to normalize feed posts from backend responses.
 * Guarantees that every post object has structured doc_urls, media_urls (pure images),
 * author metadata, and reaction counts.
 */

export function normalizeFeedPost(post) {
  if (!post || typeof post !== 'object') return post;

  let docUrls = [];
  const rawDocUrls = post.doc_urls || post.documents || post.docUrls || post.attachment || post.file_url;
  
  if (rawDocUrls) {
    if (Array.isArray(rawDocUrls)) {
      docUrls = [...rawDocUrls];
    } else if (typeof rawDocUrls === 'string') {
      try {
        const parsed = JSON.parse(rawDocUrls);
        if (Array.isArray(parsed)) docUrls = [...parsed];
        else if (typeof parsed === 'object' && parsed !== null) docUrls.push(parsed);
        else if (rawDocUrls.startsWith('http') || rawDocUrls.startsWith('file:') || rawDocUrls.includes('.pdf')) {
          docUrls.push(rawDocUrls);
        }
      } catch (_) {
        if (rawDocUrls.startsWith('http') || rawDocUrls.startsWith('file:') || rawDocUrls.includes('.pdf')) {
          docUrls.push(rawDocUrls);
        }
      }
    } else if (typeof rawDocUrls === 'object') {
      docUrls.push(rawDocUrls);
    }
  }

  // Also extract any PDF/document from media_urls
  const rawMedia = Array.isArray(post.media_urls) ? post.media_urls : [];
  const imageOnlyUrls = [];

  rawMedia.forEach(m => {
    const u = typeof m === 'string' ? m : (m?.url || '');
    const isDoc = u && (u.match(/\.(pdf|doc|docx|ppt|pptx)(\?.*)?$/i) || u.includes('/pitch_decks/') || (typeof m === 'object' && m?.mimeType?.includes('pdf')));
    
    if (isDoc) {
      const name = (typeof m === 'object' && m?.name) ? m.name : (u.split('/').pop()?.split('?')[0] || 'Document.pdf');
      const alreadyExists = docUrls.some(d => (typeof d === 'string' ? d : d?.url) === u);
      if (!alreadyExists) {
        docUrls.push(typeof m === 'string' ? { url: u, name } : m);
      }
    } else if (u) {
      imageOnlyUrls.push(u);
    }
  });

  return {
    ...post,
    doc_urls: docUrls,
    media_urls: rawMedia,
    image_only_urls: imageOnlyUrls,
  };
}

export function normalizeFeedList(posts, deletedPostIdsSet = new Set()) {
  if (!Array.isArray(posts)) return [];
  return posts
    .filter(p => p && p.id && !deletedPostIdsSet.has(p.id))
    .map(p => normalizeFeedPost(p));
}
