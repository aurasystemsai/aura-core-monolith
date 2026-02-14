/**
 * Content Templates Engine
 * Manage content templates and best practice patterns
 */

// In-memory storage
const templates = new Map();
const userTemplates = new Map();
let templateIdCounter = 1;
let userTemplateIdCounter = 1;

/**
 * Initialize default templates
 */
function initializeDefaultTemplates() {
  const defaultTemplates = [
    {
      id: templateIdCounter++,
      name: 'How-To Guide',
      category: 'educational',
      description: 'Step-by-step tutorial format',
      structure: {
        sections: [
          { order: 1, type: 'introduction', title: 'Introduction', wordCount: 150, required: true },
          { order: 2, type: 'overview', title: 'What You\'ll Learn', wordCount: 100, required: true },
          { order: 3, type: 'prerequisites', title: 'Prerequisites', wordCount: 100, required: false },
          { order: 4, type: 'steps', title: 'Step-by-Step Instructions', wordCount: 800, required: true },
          { order: 5, type: 'tips', title: 'Tips & Best Practices', wordCount: 200, required: false },
          { order: 6, type: 'conclusion', title: 'Conclusion & Next Steps', wordCount: 150, required: true }
        ],
        totalWordCount: 1500,
        requiredElements: ['numbered_list', 'images', 'headings']
      },
      seo: {
        titlePattern: 'How to [Action]: [Number] Steps to [Desired Outcome]',
        metaPattern: 'Learn how to [action] with this comprehensive guide. Follow our [number]-step process to achieve [outcome].',
        keywords: { target: 1, focus: 3 },
        targetGradeLevel: 10
      },
      isDefault: true
    },
    {
      id: templateIdCounter++,
      name: 'Listicle',
      category: 'engagement',
      description: 'Numbered or bulleted list article',
      structure: {
        sections: [
          { order: 1, type: 'introduction', title: 'Introduction', wordCount: 150, required: true },
          { order: 2, type: 'list_items', title: 'Main List', wordCount: 1200, required: true },
          { order: 3, type: 'conclusion', title: 'Conclusion', wordCount: 150, required: true }
        ],
        totalWordCount: 1500,
        requiredElements: ['numbered_list', 'headings', 'images']
      },
      seo: {
        titlePattern: '[Number] [Adjective] [Topic] That [Benefit]',
        metaPattern: 'Discover the top [number] [topic] that will help you [benefit]. Expert-curated list with actionable insights.',
        keywords: { target: 1, focus: 3 },
        targetGradeLevel: 9
      },
      isDefault: true
    },
    {
      id: templateIdCounter++,
      name: 'Product Review',
      category: 'commercial',
      description: 'Comprehensive product evaluation',
      structure: {
        sections: [
          { order: 1, type: 'summary', title: 'Quick Summary', wordCount: 150, required: true },
          { order: 2, type: 'overview', title: 'Product Overview', wordCount: 200, required: true },
          { order: 3, type: 'features', title: 'Key Features', wordCount: 400, required: true },
          { order: 4, type: 'pros_cons', title: 'Pros & Cons', wordCount: 300, required: true },
          { order: 5, type: 'testing', title: 'Our Testing Process', wordCount: 300, required: false },
          { order: 6, type: 'comparison', title: 'How It Compares', wordCount: 250, required: false },
          { order: 7, type: 'verdict', title: 'Final Verdict', wordCount: 200, required: true }
        ],
        totalWordCount: 1800,
        requiredElements: ['images', 'bulleted_list', 'table', 'headings']
      },
      seo: {
        titlePattern: '[Product Name] Review: [Key Benefit/Feature] in [Year]',
        metaPattern: 'Detailed review of [product name]. We tested [product] for [duration] to bring you an honest assessment of its [features].',
        keywords: { target: 1, focus: 4 },
        targetGradeLevel: 10
      },
      isDefault: true
    },
    {
      id: templateIdCounter++,
      name: 'Ultimate Guide',
      category: 'educational',
      description: 'Comprehensive, authoritative resource',
      structure: {
        sections: [
          { order: 1, type: 'introduction', title: 'Introduction', wordCount: 200, required: true },
          { order: 2, type: 'toc', title: 'Table of Contents', wordCount: 50, required: true },
          { order: 3, type: 'fundamentals', title: 'Fundamentals', wordCount: 800, required: true },
          { order: 4, type: 'advanced', title: 'Advanced Topics', wordCount: 800, required: true },
          { order: 5, type: 'case_studies', title: 'Case Studies', wordCount: 500, required: false },
          { order: 6, type: 'resources', title: 'Additional Resources', wordCount: 200, required: true },
          { order: 7, type: 'conclusion', title: 'Conclusion', wordCount: 150, required: true }
        ],
        totalWordCount: 2700,
        requiredElements: ['headings', 'images', 'bulleted_list', 'table_of_contents']
      },
      seo: {
        titlePattern: 'The Ultimate Guide to [Topic]: Everything You Need to Know',
        metaPattern: 'The complete guide to [topic]. Learn [key aspects] with this comprehensive resource for beginners and experts.',
        keywords: { target: 1, focus: 5 },
        targetGradeLevel: 11
      },
      isDefault: true
    },
    {
      id: templateIdCounter++,
      name: 'Comparison Article',
      category: 'commercial',
      description: 'Side-by-side product/service comparison',
      structure: {
        sections: [
          { order: 1, type: 'introduction', title: 'Introduction', wordCount: 150, required: true },
          { order: 2, type: 'overview', title: 'Products Overview', wordCount: 200, required: true },
          { order: 3, type: 'comparison_table', title: 'Quick Comparison Table', wordCount: 100, required: true },
          { order: 4, type: 'detailed_comparison', title: 'Detailed Comparison', wordCount: 800, required: true },
          { order: 5, type: 'winner', title: 'Which One Should You Choose?', wordCount: 250, required: true }
        ],
        totalWordCount: 1500,
        requiredElements: ['table', 'headings', 'bulleted_list']
      },
      seo: {
        titlePattern: '[Product A] vs [Product B]: [Year] Comparison',
        metaPattern: 'Compare [product A] and [product B] side-by-side. See which option is best for [use case].',
        keywords: { target: 2, focus: 4 },
        targetGradeLevel: 9
      },
      isDefault: true
    },
    {
      id: templateIdCounter++,
      name: 'Case Study',
      category: 'business',
      description: 'Detailed success story or example',
      structure: {
        sections: [
          { order: 1, type: 'executive_summary', title: 'Executive Summary', wordCount: 150, required: true },
          { order: 2, type: 'background', title: 'Background & Challenge', wordCount: 300, required: true },
          { order: 3, type: 'solution', title: 'Our Solution', wordCount: 400, required: true },
          { order: 4, type: 'implementation', title: 'Implementation', wordCount: 400, required: true },
          { order: 5, type: 'results', title: 'Results & ROI', wordCount: 300, required: true },
          { order: 6, type: 'testimonial', title: 'Client Testimonial', wordCount: 150, required: false }
        ],
        totalWordCount: 1700,
        requiredElements: ['headings', 'statistics', 'quotes']
      },
      seo: {
        titlePattern: 'Case Study: How [Company] Achieved [Result] with [Solution]',
        metaPattern: 'See how [company] used [solution] to achieve [result]. Detailed case study with real data and insights.',
        keywords: { target: 1, focus: 3 },
        targetGradeLevel: 12
      },
      isDefault: true
    }
  ];

  defaultTemplates.forEach(template => templates.set(template.id, template));
}

// Initialize templates on module load
initializeDefaultTemplates();

/**
 * Get all templates
 */
function getTemplates(filters = {}) {
  const { category, isDefault } = filters;
  
  let allTemplates = Array.from(templates.values());
  
  if (category) {
    allTemplates = allTemplates.filter(t => t.category === category);
  }
  
  if (isDefault !== undefined) {
    allTemplates = allTemplates.filter(t => t.isDefault === isDefault);
  }
  
  return {
    total: allTemplates.length,
    templates: allTemplates
  };
}

/**
 * Get template by ID
 */
function getTemplate(templateId) {
  const template = templates.get(templateId);
  if (!template) {
    throw new Error('Template not found');
  }
  return template;
}

/**
 * Create custom template
 */
function createCustomTemplate(data) {
  const {
    name,
    category,
    description,
    structure,
    seo
  } = data;

  const template = {
    id: userTemplateIdCounter++,
    name,
    category,
    description,
    structure,
    seo,
    isDefault: false,
    createdAt: new Date().toISOString(),
    usageCount: 0
  };

  userTemplates.set(template.id, template);
  return template;
}

/**
 * Apply template to content
 */
function applyTemplate(data) {
  const { templateId, contentId, customizations = {} } = data;

  const template = templates.get(templateId) || userTemplates.get(templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  // Create content outline based on template
  const outline = {
    contentId,
    templateId,
    templateName: template.name,
    appliedAt: new Date().toISOString(),
    
    sections: template.structure.sections.map(section => ({
      ...section,
      currentWordCount: 0,
      targetWordCount: customizations[section.type]?.wordCount || section.wordCount,
      status: 'pending', // pending, in_progress, completed
      notes: customizations[section.type]?.notes || ''
    })),
    
    checklist: {
      requiredElements: template.structure.requiredElements.map(element => ({
        element,
        completed: false
      })),
      totalProgress: 0
    },
    
    seo: {
      title: customizations.title || generateFromPattern(template.seo.titlePattern, customizations),
      metaDescription: customizations.meta || generateFromPattern(template.seo.metaPattern, customizations),
      targetKeyword: customizations.targetKeyword || '',
      focusKeyphrases: customizations.focusKeyphrases || []
    },
    
    progress: {
      sectionsCompleted: 0,
      totalSections: template.structure.sections.length,
      wordCount: 0,
      targetWordCount: template.structure.totalWordCount,
      completionPercentage: 0
    }
  };

  // Update template usage
  if (template.usageCount !== undefined) {
    template.usageCount++;
  }

  return outline;
}

/**
 * Get template recommendations based on content goal
 */
function recommendTemplate(data) {
  const { goal, targetAudience = 'general', contentType } = data;

  const goalMapping = {
    'educate': ['How-To Guide', 'Ultimate Guide'],
    'engage': ['Listicle', 'Comparison Article'],
    'convert': ['Product Review', 'Case Study'],
    'inform': ['Ultimate Guide', 'Case Study']
  };

  const recommendedNames = goalMapping[goal] || [];
  const recommended = Array.from(templates.values())
    .filter(t => recommendedNames.includes(t.name));

  return {
    goal,
    targetAudience,
    recommendations: recommended.map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      description: t.description,
      estimatedWordCount: t.structure.totalWordCount,
      estimatedTime: `${Math.ceil(t.structure.totalWordCount / 300)} hours`,
      difficulty: t.structure.totalWordCount > 2000 ? 'advanced' : t.structure.totalWordCount > 1500 ? 'intermediate' : 'beginner',
      bestFor: getBestUseCase(t)
    })),
    topRecommendation: recommended[0]
  };
}

/**
 * Validate content against template
 */
function validateAgainstTemplate(data) {
  const { templateId, content } = data;

  const template = templates.get(templateId) || userTemplates.get(templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  const validation = {
    templateId,
    templateName: template.name,
    validatedAt: new Date().toISOString(),
    
    structureCheck: {
      score: 0,
      issues: [],
      passed: false
    },
    
    elementsCheck: {
      score: 0,
      missing: [],
      present: [],
      passed: false
    },
    
    wordCountCheck: {
      current: content.wordCount || 0,
      target: template.structure.totalWordCount,
      difference: (content.wordCount || 0) - template.structure.totalWordCount,
      passed: false
    },
    
    seoCheck: {
      score: 0,
      issues: [],
      passed: false
    },
    
    overallScore: 0,
    passed: false
  };

  // Check structure
  const requiredSections = template.structure.sections.filter(s => s.required);
  const missingSections = requiredSections.filter(s => 
    !content.sections || !content.sections.includes(s.type)
  );
  
  if (missingSections.length === 0) {
    validation.structureCheck.score = 100;
    validation.structureCheck.passed = true;
  } else {
    validation.structureCheck.score = ((requiredSections.length - missingSections.length) / requiredSections.length) * 100;
    validation.structureCheck.issues = missingSections.map(s => `Missing required section: ${s.title}`);
  }

  // Check required elements
  template.structure.requiredElements.forEach(element => {
    const hasElement = content[element] !== undefined && content[element] > 0;
    if (hasElement) {
      validation.elementsCheck.present.push(element);
    } else {
      validation.elementsCheck.missing.push(element);
    }
  });
  
  validation.elementsCheck.score = (validation.elementsCheck.present.length / template.structure.requiredElements.length) * 100;
  validation.elementsCheck.passed = validation.elementsCheck.missing.length === 0;

  // Check word count
  const wordCountDiff = Math.abs((content.wordCount || 0) - template.structure.totalWordCount);
  const wordCountTolerance = template.structure.totalWordCount * 0.2; // 20% tolerance
  validation.wordCountCheck.passed = wordCountDiff <= wordCountTolerance;

  // Check SEO
  let seoScore = 0;
  if (content.title && content.title.length >= 30 && content.title.length <= 60) seoScore += 33;
  if (content.metaDescription && content.metaDescription.length >= 120 && content.metaDescription.length <= 160) seoScore += 33;
  if (content.targetKeyword) seoScore += 34;
  
  validation.seoCheck.score = seoScore;
  validation.seoCheck.passed = seoScore >= 80;
  
  if (seoScore < 80) {
    validation.seoCheck.issues.push('SEO elements need optimization');
  }

  // Calculate overall score
  validation.overallScore = Math.round(
    (validation.structureCheck.score * 0.4) +
    (validation.elementsCheck.score * 0.3) +
    (validation.wordCountCheck.passed ? 100 : 50) * 0.15 +
    (validation.seoCheck.score * 0.15)
  );
  
  validation.passed = validation.overallScore >= 80;

  return validation;
}

/**
 * Get template statistics
 */
function getTemplateStatistics() {
  const allTemplates = Array.from(templates.values());
  const allUserTemplates = Array.from(userTemplates.values());

  return {
    totalTemplates: allTemplates.length + allUserTemplates.length,
    defaultTemplates: allTemplates.length,
    customTemplates: allUserTemplates.length,
    byCategory: {
      educational: allTemplates.filter(t => t.category === 'educational').length,
      engagement: allTemplates.filter(t => t.category === 'engagement').length,
      commercial: allTemplates.filter(t => t.category === 'commercial').length,
      business: allTemplates.filter(t => t.category === 'business').length
    },
    mostUsed: [...allTemplates, ...allUserTemplates]
      .filter(t => t.usageCount !== undefined)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        name: t.name,
        usageCount: t.usageCount || 0
      }))
  };
}

// Helper functions

function generateFromPattern(pattern, customizations) {
  let result = pattern;
  
  // Replace placeholders with custom values
  Object.entries(customizations).forEach(([key, value]) => {
    const placeholder = `[${key}]`;
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), value);
  });
  
  // Remove any remaining placeholders
  result = result.replace(/\[.*?\]/g, '...');
  
  return result;
}

function getBestUseCase(template) {
  const useCases = {
    'How-To Guide': 'Teaching processes, tutorials, instructional content',
    'Listicle': 'Engagement-focused content, quick reads, social sharing',
    'Product Review': 'Affiliate marketing, product comparisons, buyer guides',
    'Ultimate Guide': 'Comprehensive resources, pillar content, SEO authority',
    'Comparison Article': 'Decision-making content, product alternatives',
    'Case Study': 'Proving ROI, B2B marketing, testimonials'
  };
  
  return useCases[template.name] || 'General content creation';
}

module.exports = {
  getTemplates,
  getTemplate,
  createCustomTemplate,
  applyTemplate,
  recommendTemplate,
  validateAgainstTemplate,
  getTemplateStatistics
};
