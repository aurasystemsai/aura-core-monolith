// src/tools/product-seo/product-seo.test.js
// Product SEO Engine tool tests

const { run } = require('./index');

describe('Product SEO Engine', () => {
  it('should generate SEO output for valid input', async () => {
    const input = {
      productTitle: 'Gold Diamond Necklace',
      productDescription: 'A beautiful 18k gold necklace with a brilliant-cut diamond pendant.',
      brand: 'AURA',
      tone: 'luxury, elegant',
      useCases: ['gift', 'wedding', 'anniversary']
    };
    const result = await run(input, { environment: 'test' });
    expect(result).toHaveProperty('output');
    expect(result.output).toHaveProperty('title');
    expect(result.output).toHaveProperty('metaDescription');
    expect(result.output).toHaveProperty('slug');
    expect(Array.isArray(result.output.keywords)).toBe(true);
    expect(result.output.title.length).toBeGreaterThan(0);
    expect(result.output.metaDescription.length).toBeGreaterThan(0);
  });

  it('should throw error for missing productTitle', async () => {
    const input = {
      productDescription: 'A beautiful 18k gold necklace with a brilliant-cut diamond pendant.'
    };
    await expect(run(input, { environment: 'test' })).rejects.toThrow('productTitle and productDescription are required');
  });

  it('should throw error for missing productDescription', async () => {
    const input = {
      productTitle: 'Gold Diamond Necklace'
    };
    await expect(run(input, { environment: 'test' })).rejects.toThrow('productTitle and productDescription are required');
  });
});
