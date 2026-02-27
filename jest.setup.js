// Global Jest setup for tests
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-10';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';
// Disable background schedulers that set intervals during tests
process.env.DISABLE_ANALYTICS_SCHEDULER = 'true';

// Mock OpenAI client in tests to avoid network calls while keeping production strict
jest.mock('openai', () => {
	const stubContent = JSON.stringify({
		title: 'Stub Title',
		metaDescription: 'Stub description',
		slug: 'stub-slug',
		keywords: ['stub'],
		h1: 'Stub H1',
		bullets: ['b1', 'b2', 'b3'],
		canonicalUrl: 'https://example.com/stub',
		tags: ['stub'],
		results: [],
		items: [],
		ross: 8.5,
		heatmap: [],
		clusters: [],
		takeaways: [],
		summary: 'Stub summary',
		forecast30: 10,
		forecast60: 8,
		forecast90: 6,
		trend: 'improving',
		confidence: 'medium',
		verdict: 'Good',
		benchmark: 'Good',
		improvements: [],
		insights: [],
		recommendations: [],
		ease: 72,
		score: 85,
		analysis: {},
		categories: [],
		suggestions: [],
		opportunities: [],
	});

	return class OpenAI {
		constructor() {}
		get chat() {
			return {
				completions: {
					create: async () => ({
						choices: [
							{
								message: { content: stubContent },
							},
						],
					}),
				},
			};
		}
		async createChatCompletion() {
			return {
				data: {
					choices: [
						{
							message: { content: stubContent },
						},
					],
				},
			};
		}
	};
});

// Silence noisy logs during tests
const noop = () => {};
console.log = noop;
console.info = noop;
console.warn = noop;
