/**
 * Review Management Engine
 * Handles product reviews, ratings, photos, videos, and verification
 */

// In-memory storage (replace with database in production)
const reviews = new Map();
const products = new Map();
const customers = new Map();
const reviewResponses = new Map();
const reviewVotes = new Map();

let reviewIdCounter = 1;
let responseIdCounter = 1;

/**
 * Create a new review
 */
function createReview(reviewData) {
  const review = {
    id: `review_${reviewIdCounter++}`,
    productId: reviewData.productId,
    customerId: reviewData.customerId,
    customerName: reviewData.customerName,
    customerEmail: reviewData.customerEmail,
    rating: reviewData.rating, // 1-5 stars
    title: reviewData.title,
    content: reviewData.content,
    verified: reviewData.verified || false, // Verified purchase
    photos: reviewData.photos || [],
    videos: reviewData.videos || [],
    pros: reviewData.pros || [],
    cons: reviewData.cons || [],
    recommendProduct: reviewData.recommendProduct !== false,
    status: reviewData.status || 'pending', // pending, approved, rejected, flagged
    helpfulCount: 0,
    notHelpfulCount: 0,
    responseCount: 0,
    flagCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    moderatedAt: null,
    moderatedBy: null,
    moderationNotes: null,
    source: reviewData.source || 'website', // website, email, import, api
    metadata: reviewData.metadata || {},
  };

  reviews.set(review.id, review);
  updateProductRating(review.productId);
  
  return review;
}

/**
 * Get review by ID
 */
function getReview(reviewId) {
  return reviews.get(reviewId);
}

/**
 * Update review
 */
function updateReview(reviewId, updates) {
  const review = reviews.get(reviewId);
  if (!review) {
    throw new Error('Review not found');
  }

  Object.assign(review, updates, {
    updatedAt: new Date().toISOString(),
  });

  if (updates.rating && review.productId) {
    updateProductRating(review.productId);
  }

  return review;
}

/**
 * Delete review
 */
function deleteReview(reviewId) {
  const review = reviews.get(reviewId);
  if (!review) {
    throw new Error('Review not found');
  }

  reviews.delete(reviewId);
  updateProductRating(review.productId);
  
  return { success: true, deletedReviewId: reviewId };
}

/**
 * Get reviews for a product
 */
function getProductReviews(productId, options = {}) {
  const {
    status = 'approved',
    sortBy = 'recent', // recent, helpful, rating_high, rating_low
    limit = 20,
    offset = 0,
    rating = null,
    verified = null,
  } = options;

  let productReviews = Array.from(reviews.values())
    .filter(r => r.productId === productId);

  // Apply filters
  if (status) {
    productReviews = productReviews.filter(r => r.status === status);
  }
  if (rating !== null) {
    productReviews = productReviews.filter(r => r.rating === rating);
  }
  if (verified !== null) {
    productReviews = productReviews.filter(r => r.verified === verified);
  }

  // Apply sorting
  if (sortBy === 'recent') {
    productReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === 'helpful') {
    productReviews.sort((a, b) => b.helpfulCount - a.helpfulCount);
  } else if (sortBy === 'rating_high') {
    productReviews.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'rating_low') {
    productReviews.sort((a, b) => a.rating - b.rating);
  }

  const total = productReviews.length;
  const paginatedReviews = productReviews.slice(offset, offset + limit);

  return {
    reviews: paginatedReviews,
    total,
    limit,
    offset,
  };
}

/**
 * Get customer reviews
 */
function getCustomerReviews(customerId, options = {}) {
  const { limit = 20, offset = 0 } = options;

  const customerReviews = Array.from(reviews.values())
    .filter(r => r.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    reviews: customerReviews.slice(offset, offset + limit),
    total: customerReviews.length,
  };
}

/**
 * Moderate review (approve, reject)
 */
function moderateReview(reviewId, moderation) {
  const review = reviews.get(reviewId);
  if (!review) {
    throw new Error('Review not found');
  }

  review.status = moderation.status; // approved, rejected, flagged
  review.moderatedAt = new Date().toISOString();
  review.moderatedBy = moderation.moderatorId;
  review.moderationNotes = moderation.notes || null;
  review.updatedAt = new Date().toISOString();

  return review;
}

/**
 * Flag review
 */
function flagReview(reviewId, flagData) {
  const review = reviews.get(reviewId);
  if (!review) {
    throw new Error('Review not found');
  }

  review.flagCount = (review.flagCount || 0) + 1;
  review.status = 'flagged';
  review.updatedAt = new Date().toISOString();

  return {
    reviewId,
    flagCount: review.flagCount,
    reason: flagData.reason,
    flaggedBy: flagData.flaggedBy,
  };
}

/**
 * Add response to review
 */
function addReviewResponse(reviewId, responseData) {
  const review = reviews.get(reviewId);
  if (!review) {
    throw new Error('Review not found');
  }

  const response = {
    id: `response_${responseIdCounter++}`,
    reviewId,
    responderId: responseData.responderId,
    responderName: responseData.responderName,
    responderType: responseData.responderType || 'merchant', // merchant, support, customer
    content: responseData.content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  reviewResponses.set(response.id, response);
  review.responseCount = (review.responseCount || 0) + 1;
  review.updatedAt = new Date().toISOString();

  return response;
}

/**
 * Get review responses
 */
function getReviewResponses(reviewId) {
  return Array.from(reviewResponses.values())
    .filter(r => r.reviewId === reviewId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

/**
 * Vote on review helpfulness
 */
function voteReview(reviewId, voteData) {
  const review = reviews.get(reviewId);
  if (!review) {
    throw new Error('Review not found');
  }

  const voteKey = `${reviewId}_${voteData.voterId}`;
  const existingVote = reviewVotes.get(voteKey);

  // Remove previous vote if exists
  if (existingVote) {
    if (existingVote.helpful) {
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      review.notHelpfulCount = Math.max(0, review.notHelpfulCount - 1);
    }
  }

  // Add new vote
  const vote = {
    reviewId,
    voterId: voteData.voterId,
    helpful: voteData.helpful,
    createdAt: new Date().toISOString(),
  };

  reviewVotes.set(voteKey, vote);

  if (vote.helpful) {
    review.helpfulCount = (review.helpfulCount || 0) + 1;
  } else {
    review.notHelpfulCount = (review.notHelpfulCount || 0) + 1;
  }

  review.updatedAt = new Date().toISOString();

  return {
    reviewId,
    helpfulCount: review.helpfulCount,
    notHelpfulCount: review.notHelpfulCount,
  };
}

/**
 * Update product rating aggregates
 */
function updateProductRating(productId) {
  const productReviews = Array.from(reviews.values())
    .filter(r => r.productId === productId && r.status === 'approved');

  if (productReviews.length === 0) {
    products.set(productId, {
      productId,
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      verifiedReviews: 0,
      recommendationRate: 0,
    });
    return;
  }

  const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / productReviews.length;

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  productReviews.forEach(r => {
    ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
  });

  const verifiedReviews = productReviews.filter(r => r.verified).length;
  const recommendCount = productReviews.filter(r => r.recommendProduct).length;
  const recommendationRate = (recommendCount / productReviews.length) * 100;

  products.set(productId, {
    productId,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: productReviews.length,
    ratingDistribution,
    verifiedReviews,
    recommendationRate: Math.round(recommendationRate),
  });
}

/**
 * Get product rating summary
 */
function getProductRatingSummary(productId) {
  return products.get(productId) || {
    productId,
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    verifiedReviews: 0,
    recommendationRate: 0,
  };
}

/**
 * Search reviews
 */
function searchReviews(query, options = {}) {
  const {
    productId = null,
    status = null,
    rating = null,
    verified = null,
    limit = 20,
    offset = 0,
  } = options;

  let results = Array.from(reviews.values());

  // Apply filters
  if (productId) {
    results = results.filter(r => r.productId === productId);
  }
  if (status) {
    results = results.filter(r => r.status === status);
  }
  if (rating !== null) {
    results = results.filter(r => r.rating === rating);
  }
  if (verified !== null) {
    results = results.filter(r => r.verified === verified);
  }

  // Search in title and content
  if (query) {
    const lowerQuery = query.toLowerCase();
    results = results.filter(r =>
      r.title.toLowerCase().includes(lowerQuery) ||
      r.content.toLowerCase().includes(lowerQuery) ||
      r.customerName.toLowerCase().includes(lowerQuery)
    );
  }

  // Sort by relevance (most recent first)
  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    reviews: results.slice(offset, offset + limit),
    total: results.length,
  };
}

/**
 * Get review statistics
 */
function getReviewStatistics(options = {}) {
  const { productId = null, dateRange = null } = options;

  let reviewList = Array.from(reviews.values());

  if (productId) {
    reviewList = reviewList.filter(r => r.productId === productId);
  }

  if (dateRange) {
    const { startDate, endDate } = dateRange;
    reviewList = reviewList.filter(r => {
      const reviewDate = new Date(r.createdAt);
      return reviewDate >= new Date(startDate) && reviewDate <= new Date(endDate);
    });
  }

  const totalReviews = reviewList.length;
  const approvedReviews = reviewList.filter(r => r.status === 'approved').length;
  const pendingReviews = reviewList.filter(r => r.status === 'pending').length;
  const rejectedReviews = reviewList.filter(r => r.status === 'rejected').length;
  const flaggedReviews = reviewList.filter(r => r.status === 'flagged').length;
  const verifiedReviews = reviewList.filter(r => r.verified).length;
  const withPhotos = reviewList.filter(r => r.photos && r.photos.length > 0).length;
  const withVideos = reviewList.filter(r => r.videos && r.videos.length > 0).length;

  const averageRating = totalReviews > 0
    ? reviewList.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  return {
    totalReviews,
    approvedReviews,
    pendingReviews,
    rejectedReviews,
    flaggedReviews,
    verifiedReviews,
    withPhotos,
    withVideos,
    averageRating: Math.round(averageRating * 10) / 10,
    verificationRate: totalReviews > 0 ? Math.round((verifiedReviews / totalReviews) * 100) : 0,
  };
}

module.exports = {
  createReview,
  getReview,
  updateReview,
  deleteReview,
  getProductReviews,
  getCustomerReviews,
  moderateReview,
  flagReview,
  addReviewResponse,
  getReviewResponses,
  voteReview,
  getProductRatingSummary,
  searchReviews,
  getReviewStatistics,
};
