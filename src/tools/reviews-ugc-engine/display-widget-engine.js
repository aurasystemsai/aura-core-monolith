/**
 * Display & Widget Engine
 * Handles review widgets, embeds, carousels, and customizable display components
 */

// In-memory storage
const widgets = new Map();
const carousels = new Map();
const embeds = new Map();
const themes = new Map();

let widgetIdCounter = 1;
let carouselIdCounter = 1;
let embedIdCounter = 1;
let themeIdCounter = 1;

/**
 * Create review widget
 */
function createReviewWidget(widgetData) {
  const widget = {
    id: `widget_${widgetIdCounter++}`,
    name: widgetData.name,
    type: widgetData.type || 'standard', // standard, compact, detailed, grid, list
    productId: widgetData.productId || null,
    layout: {
      columns: widgetData.layout?.columns || 1,
      maxReviews: widgetData.layout?.maxReviews || 10,
      showPagination: widgetData.layout?.showPagination !== false,
      itemsPerPage: widgetData.layout?.itemsPerPage || 5,
    },
    display: {
      showRating: widgetData.display?.showRating !== false,
      showDate: widgetData.display?.showDate !== false,
      showVerifiedBadge: widgetData.display?.showVerifiedBadge !== false,
      showPhotos: widgetData.display?.showPhotos !== false,
      showVideos: widgetData.display?.showVideos !== false,
      showHelpfulVotes: widgetData.display?.showHelpfulVotes !== false,
      showCustomerName: widgetData.display?.showCustomerName !== false,
      showReviewTitle: widgetData.display?.showReviewTitle !== false,
      showFullReview: widgetData.display?.showFullReview !== false,
      maxContentLength: widgetData.display?.maxContentLength || 300,
    },
    filters: {
      minRating: widgetData.filters?.minRating || null,
      verified: widgetData.filters?.verified || null,
      withPhotos: widgetData.filters?.withPhotos || false,
      sortBy: widgetData.filters?.sortBy || 'recent',
    },
    styling: {
      themeId: widgetData.styling?.themeId || 'default',
      customCSS: widgetData.styling?.customCSS || '',
      borderRadius: widgetData.styling?.borderRadius || '8px',
      spacing: widgetData.styling?.spacing || 'normal',
    },
    interactivity: {
      allowVoting: widgetData.interactivity?.allowVoting !== false,
      allowFiltering: widgetData.interactivity?.allowFiltering !== false,
      allowSorting: widgetData.interactivity?.allowSorting !== false,
      expandable: widgetData.interactivity?.expandable !== false,
    },
    analytics: {
      views: 0,
      interactions: 0,
      helpfulVotes: 0,
      photoClicks: 0,
    },
    status: widgetData.status || 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  widgets.set(widget.id, widget);
  return widget;
}

/**
 * Update widget
 */
function updateReviewWidget(widgetId, updates) {
  const widget = widgets.get(widgetId);
  if (!widget) {
    throw new Error('Widget not found');
  }

  Object.assign(widget, updates, {
    updatedAt: new Date().toISOString(),
  });

  return widget;
}

/**
 * Get widget
 */
function getReviewWidget(widgetId) {
  return widgets.get(widgetId);
}

/**
 * List widgets
 */
function listReviewWidgets(options = {}) {
  const { status = null, productId = null } = options;

  let widgetList = Array.from(widgets.values());

  if (status) {
    widgetList = widgetList.filter(w => w.status === status);
  }
  if (productId) {
    widgetList = widgetList.filter(w => w.productId === productId || w.productId === null);
  }

  return widgetList;
}

/**
 * Generate widget embed code
 */
function generateWidgetEmbedCode(widgetId) {
  const widget = widgets.get(widgetId);
  if (!widget) {
    throw new Error('Widget not found');
  }

  const embedCode = `
<!-- Reviews Widget -->
<div id="reviews-widget-${widgetId}" 
     data-widget-id="${widgetId}" 
     data-product-id="${widget.productId || ''}"
     data-type="${widget.type}">
</div>
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://cdn.example.com/reviews-widget.js';
    script.async = true;
    script.onload = function() {
      ReviewsWidget.init('reviews-widget-${widgetId}', {
        widgetId: '${widgetId}',
        apiKey: 'YOUR_API_KEY'
      });
    };
    document.head.appendChild(script);
  })();
</script>
`;

  return {
    widgetId,
    embedCode: embedCode.trim(),
    instructions: 'Copy and paste this code into your website where you want the widget to appear.',
  };
}

/**
 * Track widget analytics
 */
function trackWidgetAnalytics(widgetId, eventType, eventData = {}) {
  const widget = widgets.get(widgetId);
  if (!widget) {
    throw new Error('Widget not found');
  }

  switch (eventType) {
    case 'view':
      widget.analytics.views += 1;
      break;
    case 'interaction':
      widget.analytics.interactions += 1;
      break;
    case 'helpful_vote':
      widget.analytics.helpfulVotes += 1;
      break;
    case 'photo_click':
      widget.analytics.photoClicks += 1;
      break;
  }

  widget.updatedAt = new Date().toISOString();

  return widget.analytics;
}

/**
 * Create review carousel
 */
function createReviewCarousel(carouselData) {
  const carousel = {
    id: `carousel_${carouselIdCounter++}`,
    name: carouselData.name,
    productIds: carouselData.productIds || [],
    display: {
      autoPlay: carouselData.display?.autoPlay !== false,
      autoPlaySpeed: carouselData.display?.autoPlaySpeed || 5000,
      showArrows: carouselData.display?.showArrows !== false,
      showDots: carouselData.display?.showDots !== false,
      slidesToShow: carouselData.display?.slidesToShow || 3,
      slidesToScroll: carouselData.display?.slidesToScroll || 1,
      responsive: carouselData.display?.responsive !== false,
    },
    content: {
      reviewCount: carouselData.content?.reviewCount || 10,
      showRating: carouselData.content?.showRating !== false,
      showPhotos: carouselData.content?.showPhotos !== false,
      maxContentLength: carouselData.content?.maxContentLength || 150,
      highlightVerified: carouselData.content?.highlightVerified !== false,
    },
    styling: {
      height: carouselData.styling?.height || 'auto',
      cardStyle: carouselData.styling?.cardStyle || 'modern',
      themeId: carouselData.styling?.themeId || 'default',
    },
    analytics: {
      views: 0,
      slides: 0,
      clicks: 0,
    },
    status: carouselData.status || 'active',
    createdAt: new Date().toISOString(),
  };

  carousels.set(carousel.id, carousel);
  return carousel;
}

/**
 * Get carousel
 */
function getReviewCarousel(carouselId) {
  return carousels.get(carouselId);
}

/**
 * List carousels
 */
function listReviewCarousels() {
  return Array.from(carousels.values());
}

/**
 * Track carousel analytics
 */
function trackCarouselAnalytics(carouselId, eventType) {
  const carousel = carousels.get(carouselId);
  if (!carousel) {
    throw new Error('Carousel not found');
  }

  switch (eventType) {
    case 'view':
      carousel.analytics.views += 1;
      break;
    case 'slide':
      carousel.analytics.slides += 1;
      break;
    case 'click':
      carousel.analytics.clicks += 1;
      break;
  }

  return carousel.analytics;
}

/**
 * Create review embed
 */
function createReviewEmbed(embedData) {
  const embed = {
    id: `embed_${embedIdCounter++}`,
    name: embedData.name,
    type: embedData.type || 'single', // single, multi, aggregate
    reviewIds: embedData.reviewIds || [],
    productId: embedData.productId || null,
    display: {
      showRating: embedData.display?.showRating !== false,
      showCustomerName: embedData.display?.showCustomerName !== false,
      showDate: embedData.display?.showDate !== false,
      showPhotos: embedData.display?.showPhotos !== false,
      compact: embedData.display?.compact || false,
    },
    styling: {
      width: embedData.styling?.width || '100%',
      maxWidth: embedData.styling?.maxWidth || '600px',
      alignment: embedData.styling?.alignment || 'left',
      themeId: embedData.styling?.themeId || 'default',
    },
    analytics: {
      impressions: 0,
      clicks: 0,
    },
    createdAt: new Date().toISOString(),
  };

  embeds.set(embed.id, embed);
  return embed;
}

/**
 * Generate embed code
 */
function generateEmbedCode(embedId) {
  const embed = embeds.get(embedId);
  if (!embed) {
    throw new Error('Embed not found');
  }

  const embedCode = `
<div class="review-embed" data-embed-id="${embedId}">
  <script src="https://cdn.example.com/reviews-embed.js" 
          data-embed="${embedId}" 
          async></script>
</div>
`;

  return {
    embedId,
    embedCode: embedCode.trim(),
  };
}

/**
 * Create display theme
 */
function createTheme(themeData) {
  const theme = {
    id: `theme_${themeIdCounter++}`,
    name: themeData.name,
    colors: {
      primary: themeData.colors?.primary || '#4CAF50',
      secondary: themeData.colors?.secondary || '#2196F3',
      text: themeData.colors?.text || '#333333',
      background: themeData.colors?.background || '#FFFFFF',
      border: themeData.colors?.border || '#E0E0E0',
      star: themeData.colors?.star || '#FFC107',
      verified: themeData.colors?.verified || '#4CAF50',
    },
    typography: {
      fontFamily: themeData.typography?.fontFamily || 'Arial, sans-serif',
      fontSize: themeData.typography?.fontSize || '14px',
      lineHeight: themeData.typography?.lineHeight || '1.5',
      titleSize: themeData.typography?.titleSize || '18px',
      titleWeight: themeData.typography?.titleWeight || 'bold',
    },
    spacing: {
      padding: themeData.spacing?.padding || '16px',
      margin: themeData.spacing?.margin || '12px',
      gap: themeData.spacing?.gap || '8px',
    },
    borders: {
      radius: themeData.borders?.radius || '8px',
      width: themeData.borders?.width || '1px',
      style: themeData.borders?.style || 'solid',
    },
    shadows: {
      card: themeData.shadows?.card || '0 2px 4px rgba(0,0,0,0.1)',
      hover: themeData.shadows?.hover || '0 4px 8px rgba(0,0,0,0.15)',
    },
    isDefault: themeData.isDefault || false,
    createdAt: new Date().toISOString(),
  };

  themes.set(theme.id, theme);
  return theme;
}

/**
 * Get theme
 */
function getTheme(themeId) {
  return themes.get(themeId) || getDefaultTheme();
}

/**
 * Get default theme
 */
function getDefaultTheme() {
  const defaultTheme = Array.from(themes.values()).find(t => t.isDefault);
  if (defaultTheme) {
    return defaultTheme;
  }

  // Create default theme if none exists
  return createTheme({
    name: 'Default',
    isDefault: true,
  });
}

/**
 * List themes
 */
function listThemes() {
  return Array.from(themes.values());
}

/**
 * Generate widget preview
 */
function generateWidgetPreview(widgetId, sampleReviews) {
  const widget = widgets.get(widgetId);
  if (!widget) {
    throw new Error('Widget not found');
  }

  const theme = getTheme(widget.styling.themeId);

  // Apply widget filters to sample reviews
  let filteredReviews = [...sampleReviews];

  if (widget.filters.minRating) {
    filteredReviews = filteredReviews.filter(r => r.rating >= widget.filters.minRating);
  }

  if (widget.filters.verified !== null) {
    filteredReviews = filteredReviews.filter(r => r.verified === widget.filters.verified);
  }

  if (widget.filters.withPhotos) {
    filteredReviews = filteredReviews.filter(r => r.photos && r.photos.length > 0);
  }

  // Apply sorting
  if (widget.filters.sortBy === 'recent') {
    filteredReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (widget.filters.sortBy === 'helpful') {
    filteredReviews.sort((a, b) => b.helpfulCount - a.helpfulCount);
  } else if (widget.filters.sortBy === 'rating_high') {
    filteredReviews.sort((a, b) => b.rating - a.rating);
  }

  // Limit to max reviews
  filteredReviews = filteredReviews.slice(0, widget.layout.maxReviews);

  return {
    widgetId,
    widgetType: widget.type,
    theme,
    layout: widget.layout,
    display: widget.display,
    reviews: filteredReviews.map(review => ({
      ...review,
      contentTruncated: widget.display.maxContentLength && review.content.length > widget.display.maxContentLength
        ? review.content.substring(0, widget.display.maxContentLength) + '...'
        : review.content,
    })),
    totalReviews: filteredReviews.length,
  };
}

/**
 * Get display statistics
 */
function getDisplayStatistics() {
  const totalWidgets = widgets.size;
  const activeWidgets = Array.from(widgets.values()).filter(w => w.status === 'active').length;

  const totalWidgetViews = Array.from(widgets.values())
    .reduce((sum, w) => sum + w.analytics.views, 0);
  const totalWidgetInteractions = Array.from(widgets.values())
    .reduce((sum, w) => sum + w.analytics.interactions, 0);

  const totalCarousels = carousels.size;
  const activeCarousels = Array.from(carousels.values()).filter(c => c.status === 'active').length;

  const totalCarouselViews = Array.from(carousels.values())
    .reduce((sum, c) => sum + c.analytics.views, 0);

  const totalEmbeds = embeds.size;
  const totalEmbedImpressions = Array.from(embeds.values())
    .reduce((sum, e) => sum + e.analytics.impressions, 0);

  return {
    widgets: {
      total: totalWidgets,
      active: activeWidgets,
      totalViews: totalWidgetViews,
      totalInteractions: totalWidgetInteractions,
      avgInteractionRate: totalWidgetViews > 0
        ? ((totalWidgetInteractions / totalWidgetViews) * 100).toFixed(2)
        : 0,
    },
    carousels: {
      total: totalCarousels,
      active: activeCarousels,
      totalViews: totalCarouselViews,
    },
    embeds: {
      total: totalEmbeds,
      totalImpressions: totalEmbedImpressions,
    },
    themes: themes.size,
  };
}

module.exports = {
  createReviewWidget,
  updateReviewWidget,
  getReviewWidget,
  listReviewWidgets,
  generateWidgetEmbedCode,
  trackWidgetAnalytics,
  createReviewCarousel,
  getReviewCarousel,
  listReviewCarousels,
  trackCarouselAnalytics,
  createReviewEmbed,
  generateEmbedCode,
  createTheme,
  getTheme,
  listThemes,
  generateWidgetPreview,
  getDisplayStatistics,
};
