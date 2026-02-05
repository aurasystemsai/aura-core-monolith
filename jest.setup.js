// Global Jest setup for tests
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-10';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';

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
