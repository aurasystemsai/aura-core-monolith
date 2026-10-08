jest.mock('../core/shopTokens', () => ({
  getToken: jest.fn(() => 'shop-access-token'),
}));

const { applyProductFields } = require('../core/shopifyApply');

describe('Shopify product SEO updates', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('updates Shopify SEO title and description through the product SEO API', async () => {
    jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, text: async () => '' })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { productUpdate: { userErrors: [] } } }),
      });

    await expect(applyProductFields('demo.myshopify.com', '123', {
      title: 'Shop product title',
      seoTitle: 'Search result title',
      metaDescription: 'Search result description',
    })).resolves.toEqual({ ok: true, message: 'Product updated on Shopify' });

    const [, seoRequest] = global.fetch.mock.calls;
    const apiVersion = process.env.SHOPIFY_API_VERSION || '2025-10';
    expect(seoRequest[0]).toBe(`https://demo.myshopify.com/admin/api/${apiVersion}/graphql.json`);
    const requestBody = JSON.parse(seoRequest[1].body);
    const [apiYear, apiMonth] = apiVersion.split('-').map(Number);
    const inputKey = apiYear > 2024 || (apiYear === 2024 && apiMonth >= 10) ? 'product' : 'input';
    expect(requestBody.variables[inputKey]).toEqual({
      id: 'gid://shopify/Product/123',
      seo: { title: 'Search result title', description: 'Search result description' },
    });
    expect(requestBody.query).toContain(`productUpdate(${inputKey}: $${inputKey})`);
  });

  test('surfaces Shopify GraphQL user errors instead of reporting success', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { productUpdate: { userErrors: [{ message: 'Product was not found' }] } },
      }),
    });

    await expect(applyProductFields('demo.myshopify.com', 'missing', {
      seoTitle: 'Search result title',
    })).rejects.toThrow('Shopify SEO update failed: Product was not found');
  });
});
