/**
 * SEO OPTIMIZER ENGINE
 * Metadata optimization, schema markup, keyword density analysis,
 * internal linking, image alt text, and technical SEO checks
 */

const crypto = require('crypto');

// In-memory stores
const seoAnalyses = new Map();
const metadataOptimizations = new Map();
const schemaMarkup = new Map();
const keywordDensities = new Map();
const linkAnalyses = new Map();
const imageAudits = new Map();

// ================================================================
// SEO ANALYSIS
// ================================================================

function analyzeSEO(draftId, content, metadata = {}) {
  const analysisId = `seo-${crypto.randomBytes(4).toString('hex')}`;
  
  const metadataScore = scoreMetadata(metadata);
  const contentScore = scoreContent(content, metadata.primaryKeyword);
  const technicalScore = scoreTechnical(content);
  const linkScore = scoreLinking(content);
  
  const overallScore = Math.round(
    metadataScore * 0.30 +
    contentScore * 0.35 +
    technicalScore * 0.20 +
    linkScore * 0.15
  );
  
  const grade = overallScore >= 90 ? 'A' :
                overallScore >= 80 ? 'B' :
                overallScore >= 70 ? 'C' :
                overallScore >= 60 ? 'D' : 'F';
  
  const analysis = {
    analysisId,
    draftId,
    overallScore,
    grade,
    metadataScore,
    contentScore,
    technicalScore,
    linkScore,
    recommendations: generateSEORecommendations(overallScore, {
      metadata: metadataScore,
      content: contentScore,
      technical: technicalScore,
      links: linkScore
    }),
    timestamp: new Date().toISOString()
  };
  
  seoAnalyses.set(analysisId, analysis);
  return analysis;
}

function scoreMetadata(metadata) {
  let score = 0;
  const checks = [];
  
  // Title tag
  if (metadata.title) {
    const titleLen = metadata.title.length;
    if (titleLen >= 50 && titleLen <= 60) {
      score += 25;
      checks.push({ field: 'title', status: 'optimal', score: 25 });
    } else if (titleLen >= 40 && titleLen <= 70) {
      score += 20;
      checks.push({ field: 'title', status: 'good', score: 20 });
    } else {
      score += 10;
      checks.push({ field: 'title', status: 'needs_improvement', score: 10 });
    }
  }
  
  // Meta description
  if (metadata.metaDescription) {
    const metaLen = metadata.metaDescription.length;
    if (metaLen >= 150 && metaLen <= 160) {
      score += 25;
      checks.push({ field: 'metaDescription', status: 'optimal', score: 25 });
    } else if (metaLen >= 120 && metaLen <= 170) {
      score += 20;
      checks.push({ field: 'metaDescription', status: 'good', score: 20 });
    } else {
      score += 10;
      checks.push({ field: 'metaDescription', status: 'needs_improvement', score: 10 });
    }
  }
  
  // Slug/URL
  if (metadata.slug) {
    const slugLen = metadata.slug.length;
    const hasKeyword = metadata.primaryKeyword && 
      metadata.slug.toLowerCase().includes(metadata.primaryKeyword.toLowerCase().replace(/\s+/g, '-'));
    
    if (slugLen <= 60 && hasKeyword) {
      score += 25;
      checks.push({ field: 'slug', status: 'optimal', score: 25 });
    } else if (slugLen <= 75) {
      score += 15;
      checks.push({ field: 'slug', status: 'good', score: 15 });
    } else {
      score += 5;
      checks.push({ field: 'slug', status: 'needs_improvement', score: 5 });
    }
  }
  
  // Primary keyword
  if (metadata.primaryKeyword) {
    score += 25;
    checks.push({ field: 'primaryKeyword', status: 'present', score: 25 });
  }
  
  return score;
}

function scoreContent(content, primaryKeyword) {
  let score = 0;
  
  // Keyword in first paragraph
  const firstPara = content.split(/\n\n/)[0] || '';
  if (primaryKeyword && firstPara.toLowerCase().includes(primaryKeyword.toLowerCase())) {
    score += 20;
  }
  
  // Keyword density
  const density = calculateKeywordDensity(content, primaryKeyword);
  if (density >= 0.5 && density <= 2.5) {
    score += 25;
  } else if (density >= 0.3 && density <= 3.0) {
    score += 15;
  } else {
    score += 5;
  }
  
  // Headings
  const headingCount = (content.match(/^#{1,6}\s+/gm) || []).length;
  if (headingCount >= 3) {
    score += 20;
  } else if (headingCount >= 1) {
    score += 10;
  }
  
  // Content length
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 1500) {
    score += 20;
  } else if (wordCount >= 1000) {
    score += 15;
  } else if (wordCount >= 500) {
    score += 10;
  } else {
    score += 5;
  }
  
  // Keyword in headings
  const headings = content.match(/^#{1,6}\s+(.+)$/gm) || [];
  const keywordInHeadings = primaryKeyword && headings.some(h => 
    h.toLowerCase().includes(primaryKeyword.toLowerCase())
  );
  if (keywordInHeadings) {
    score += 15;
  }
  
  return Math.min(100, score);
}

function scoreTechnical(content) {
  let score = 0;
  
  // Check for images
  const imageCount = (content.match(/!\[.*?\]\(.*?\)/g) || []).length;
  if (imageCount >= 2) {
    score += 25;
  } else if (imageCount >= 1) {
    score += 15;
  } else {
    score += 5;
  }
  
  // Check for alt text on images
  const imagesWithAlt = (content.match(/!\[.+?\]\(.*?\)/g) || []).length;
  if (imagesWithAlt === imageCount && imageCount > 0) {
    score += 20;
  } else if (imagesWithAlt > 0) {
    score += 10;
  }
  
  // Check for proper heading hierarchy
  const h1Count = (content.match(/^#\s+/gm) || []).length;
  if (h1Count === 1) {
    score += 20;
  } else if (h1Count === 0) {
    score += 10;
  }
  
  // Check for lists
  const listCount = (content.match(/^[\*\-\d]+\.\s+/gm) || []).length;
  if (listCount >= 3) {
    score += 15;
  } else if (listCount >= 1) {
    score += 10;
  }
  
  // Check for bold/emphasis
  const emphasisCount = (content.match(/\*\*.*?\*\*/g) || []).length;
  if (emphasisCount >= 3) {
    score += 10;
  } else if (emphasisCount >= 1) {
    score += 5;
  }
  
  // Check for links
  const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length;
  if (linkCount >= 5) {
    score += 10;
  } else if (linkCount >= 2) {
    score += 5;
  }
  
  return Math.min(100, score);
}

function scoreLinking(content) {
  const links = content.match(/\[.*?\]\((.*?)\)/g) || [];
  
  let score = 0;
  
  // Internal links
  const internalLinks = links.filter(l => !l.match(/https?:\/\//));
  if (internalLinks.length >= 3) {
    score += 40;
  } else if (internalLinks.length >= 1) {
    score += 25;
  }
  
  // External links
  const externalLinks = links.filter(l => l.match(/https?:\/\//));
  if (externalLinks.length >= 2) {
    score += 30;
  } else if (externalLinks.length >= 1) {
    score += 20;
  }
  
  // Descriptive anchor text (not just "click here")
  const descriptiveLinks = links.filter(l => {
    const match = l.match(/\[(.*?)\]/);
    return match && match[1].length > 5 && !match[1].toLowerCase().match(/click here|read more|here/);
  });
  if (descriptiveLinks.length >= links.length * 0.8) {
    score += 30;
  } else if (descriptiveLinks.length >= links.length * 0.5) {
    score += 15;
  }
  
  return Math.min(100, score);
}

function calculateKeywordDensity(content, keyword) {
  if (!keyword) return 0;
  
  const contentLower = content.toLowerCase();
  const keywordLower = keyword.toLowerCase();
  
  const occurrences = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length;
  const wordCount = content.split(/\s+/).length;
  
  return (occurrences / wordCount) * 100;
}

function generateSEORecommendations(overallScore, scores) {
  const recommendations = [];
  
  if (scores.metadata < 70) {
    recommendations.push({
      priority: 'high',
      category: 'metadata',
      message: 'Optimize title tag and meta description lengths'
    });
  }
  
  if (scores.content < 70) {
    recommendations.push({
      priority: 'high',
      category: 'content',
      message: 'Improve keyword usage  and placement in content'
    });
  }
  
  if (scores.technical < 70) {
    recommendations.push({
      priority: 'medium',
      category: 'technical',
      message: 'Add more images with alt text and improve heading structure'
    });
  }
  
  if (scores.links < 70) {
    recommendations.push({
      priority: 'medium',
      category: 'links',
      message: 'Add more internal and external links with descriptive anchor text'
    });
  }
  
  if (overallScore >= 90) {
    recommendations.push({
      priority: 'low',
      category: 'general',
      message: 'SEO optimization is excellent. Minor tweaks only.'
    });
  }
  
  return recommendations;
}

// ================================================================
// METADATA OPTIMIZATION
// ================================================================

function optimizeMetadata(draftId, currentMetadata) {
  const optId = `opt-${crypto.randomBytes(4).toString('hex')}`;
  
  const optimized = {
    optId,
    draftId,
    current: currentMetadata,
    optimized: {},
    improvements: [],
    timestamp: new Date().toISOString()
  };
  
  // Optimize title
  if (currentMetadata.title) {
    const titleOpt = optimizeTitle(currentMetadata.title, currentMetadata.primaryKeyword);
    optimized.optimized.title = titleOpt.optimized;
    if (titleOpt.changed) {
      optimized.improvements.push({
        field: 'title',
        before: currentMetadata.title,
        after: titleOpt.optimized,
        reason: titleOpt.reason
      });
    }
  }
  
  // Optimize meta description
  if (currentMetadata.metaDescription) {
    const metaOpt = optimizeMetaDescription(currentMetadata.metaDescription, currentMetadata.primaryKeyword);
    optimized.optimized.metaDescription = metaOpt.optimized;
    if (metaOpt.changed) {
      optimized.improvements.push({
        field: 'metaDescription',
        before: currentMetadata.metaDescription,
        after: metaOpt.optimized,
        reason: metaOpt.reason
      });
    }
  }
  
  // Optimize slug
  if (currentMetadata.slug) {
    const slugOpt = optimizeSlug(currentMetadata.slug, currentMetadata.primaryKeyword);
    optimized.optimized.slug = slugOpt.optimized;
    if (slugOpt.changed) {
      optimized.improvements.push({
        field: 'slug',
        before: currentMetadata.slug,
        after: slugOpt.optimized,
        reason: slugOpt.reason
      });
    }
  }
  
  metadataOptimizations.set(optId, optimized);
  return optimized;
}

function optimizeTitle(title, keyword) {
  let optimized = title;
  let changed = false;
  let reason = '';
  
  // Ensure keyword is present
  if (keyword && !title.toLowerCase().includes(keyword.toLowerCase())) {
    optimized = `${keyword}: ${title}`;
    changed = true;
    reason = 'Added primary keyword to title';
  }
  
  // Trim if too long
  if (optimized.length > 60) {
    optimized = optimized.substring(0, 57) + '...';
    changed = true;
    reason += (reason ? '; ' : '') + 'Trimmed title to optimal length';
  }
  
  // Pad if too short
  if (optimized.length < 50 && keyword) {
    optimized = `${optimized} - Complete Guide`;
    changed = true;
    reason += (reason ? '; ' : '') + 'Expanded title to optimal length';
  }
  
  return { optimized, changed, reason };
}

function optimizeMetaDescription(description, keyword) {
  let optimized = description;
  let changed = false;
  let reason = '';
  
  // Ensure keyword is present
  if (keyword && !description.toLowerCase().includes(keyword.toLowerCase())) {
    optimized = `${keyword} - ${description}`;
    changed = true;
    reason = 'Added primary keyword to meta description';
  }
  
  // Trim if too long
  if (optimized.length > 160) {
    optimized = optimized.substring(0, 157) + '...';
    changed = true;
    reason += (reason ? '; ' : '') + 'Trimmed to optimal length';
  }
  
  // Pad if too short
  if (optimized.length < 150) {
    optimized = `${optimized} Learn more here.`;
    changed = true;
    reason += (reason ? '; ' : '') + 'Expanded to optimal length';
  }
  
  return { optimized, changed, reason };
}

function optimizeSlug(slug, keyword) {
  let optimized = slug;
  let changed = false;
  let reason = '';
  
  // Convert to lowercase
  if (slug !== slug.toLowerCase()) {
    optimized = optimized.toLowerCase();
    changed = true;
    reason = 'Converted to lowercase';
  }
  
  // Replace spaces with hyphens
  if (optimized.includes(' ')) {
    optimized = optimized.replace(/\s+/g, '-');
    changed = true;
    reason += (reason ? '; ' : '') + 'Replaced spaces with hyphens';
  }
  
  // Remove special characters
  if (optimized.match(/[^a-z0-9-]/)) {
    optimized = optimized.replace(/[^a-z0-9-]/g, '');
    changed = true;
    reason += (reason ? '; ' : '') + 'Removed special characters';
  }
  
  // Ensure keyword is present
  if (keyword) {
    const keywordSlug = keyword.toLowerCase().replace(/\s+/g, '-');
    if (!optimized.includes(keywordSlug)) {
      optimized = `${keywordSlug}-${optimized}`;
      changed = true;
      reason += (reason ? '; ' : '') + 'Added primary keyword';
    }
  }
  
  // Trim if too long
  if (optimized.length > 60) {
    optimized = optimized.substring(0, 60).replace(/-[^-]*$/, '');
    changed = true;
    reason += (reason ? '; ' : '') + 'Trimmed to optimal length';
  }
  
  return { optimized, changed, reason };
}

// ================================================================
// SCHEMA MARKUP
// ================================================================

function generateSchemaMarkup(draftId, type, data) {
  const schemaId = `schema-${crypto.randomBytes(4).toString('hex')}`;
  
  let schema = {};
  
  switch (type) {
    case 'Article':
      schema = generateArticleSchema(data);
      break;
    case 'BlogPosting':
      schema = generateBlogPostingSchema(data);
      break;
    case 'HowTo':
      schema = generateHowToSchema(data);
      break;
    case 'FAQPage':
      schema = generateFAQSchema(data);
      break;
    default:
      schema = generateArticleSchema(data);
  }
  
  const markup = {
    schemaId,
    draftId,
    type,
    schema,
    jsonLd: JSON.stringify(schema, null, 2),
    timestamp: new Date().toISOString()
  };
  
  schemaMarkup.set(schemaId, markup);
  return markup;
}

function generateArticleSchema(data) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title,
    description: data.description,
    image: data.image || 'https://example.com/default-image.jpg',
    author: {
      '@type': 'Person',
      name: data.author || 'AURA Team'
    },
    publisher: {
      '@type': 'Organization',
      name: data.publisher || 'AURA',
      logo: {
        '@type': 'ImageObject',
        url: data.publisherLogo || 'https://example.com/logo.jpg'
      }
    },
    datePublished: data.datePublished || new Date().toISOString(),
    dateModified: data.dateModified || new Date().toISOString()
  };
}

function generateBlogPostingSchema(data) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: data.title,
    description: data.description,
    image: data.image || 'https://example.com/default-image.jpg',
    author: {
      '@type': 'Person',
      name: data.author || 'AURA Team'
    },
    publisher: {
      '@type': 'Organization',
      name: data.publisher || 'AURA'
    },
    datePublished: data.datePublished || new Date().toISOString(),
    mainEntityOfPage: data.url || 'https://example.com'
  };
}

function generateHowToSchema(data) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: data.title,
    description: data.description,
    step: (data.steps || []).map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text
    }))
  };
}

function generateFAQSchema(data) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (data.faqs || []).map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

// ================================================================
// IMAGE OPTIMIZATION
// ================================================================

function auditImages(draftId, content) {
  const auditId = `img-audit-${crypto.randomBytes(4).toString('hex')}`;
  
  const images = extractImages(content);
  
  const audit = {
    auditId,
    draftId,
    totalImages: images.length,
    imagesWithAlt: images.filter(img => img.alt && img.alt.length > 0).length,
    imagesWithoutAlt: images.filter(img => !img.alt || img.alt.length === 0).length,
    avgAltLength: images.reduce((sum, img) => sum + (img.alt?.length || 0), 0) / images.length || 0,
    images,
    recommendations: generateImageRecommendations(images),
    timestamp: new Date().toISOString()
  };
  
  imageAudits.set(auditId, audit);
  return audit;
}

function extractImages(content) {
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
  const images = [];
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    images.push({
      alt: match[1],
      url: match[2],
      hasAlt: match[1].length > 0,
      altLength: match[1].length
    });
  }
  
  return images;
}

function generateImageRecommendations(images) {
  const recommendations = [];
  
  const missingAlt = images.filter(img => !img.hasAlt);
  if (missingAlt.length > 0) {
    recommendations.push({
      priority: 'high',
      message: `${missingAlt.length} image(s) missing alt text`,
      action: 'Add descriptive alt text to all images'
    });
  }
  
  const shortAlt = images.filter(img => img.hasAlt && img.altLength < 10);
  if (shortAlt.length > 0) {
    recommendations.push({
      priority: 'medium',
      message: `${shortAlt.length} image(s) have very short alt text`,
      action: 'Expand alt text to be more descriptive'
    });
  }
  
  if (images.length === 0) {
    recommendations.push({
      priority: 'medium',
      message: 'No images found in content',
      action: 'Consider adding relevant images to improve engagement'
    });
  }
  
  return recommendations;
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // SEO Analysis
  analyzeSEO,
  scoreMetadata,
  scoreContent,
  scoreTechnical,
  scoreLinking,
  calculateKeywordDensity,
  
  // Metadata Optimization
  optimizeMetadata,
  optimizeTitle,
  optimizeMetaDescription,
  optimizeSlug,
  
  // Schema Markup
  generateSchemaMarkup,
  generateArticleSchema,
  generateBlogPostingSchema,
  generateHowToSchema,
  generateFAQSchema,
  
  // Image Optimization
  auditImages,
  extractImages,
  
  // Internal stores
  seoAnalyses,
  metadataOptimizations,
  schemaMarkup,
  keywordDensities,
  linkAnalyses,
  imageAudits
};
