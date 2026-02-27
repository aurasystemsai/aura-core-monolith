/**
 * Mock for node-fetch — used in Jest tests to prevent real HTTP requests.
 * Intercepts all `await import('node-fetch')` and `require('node-fetch')` calls.
 * Returns a realistic HTML response that satisfies all blog-seo route handlers.
 */
const MOCK_HTML =
  '<html><head>' +
  '<title>Test Blog Post About SEO Strategies</title>' +
  '<meta name="description" content="The complete guide to blog SEO in 2025">' +
  '<link rel="canonical" href="https://example.com/blog">' +
  '<meta property="article:published_time" content="2024-01-15T10:00:00Z">' +
  '<meta property="article:modified_time" content="2024-11-15T10:00:00Z">' +
  '</head><body>' +
  '<h1>Blog SEO Strategies for 2025</h1>' +
  '<p>Search engine optimisation is the practice of improving a website visibility in organic ' +
  'search results. Every SEO strategy should include keyword research and link building.</p>' +
  '<h2>Keyword Research</h2>' +
  '<p>Keyword research helps you find the right search terms to target with your content.</p>' +
  '<h2>On-Page Optimisation</h2>' +
  '<p>On-page SEO involves optimising individual pages to rank higher and earn more relevant traffic.</p>' +
  '<h2>Link Building</h2>' +
  '<p>Acquiring quality backlinks from authoritative websites significantly improves domain authority.</p>' +
  '<h2>Technical SEO</h2>' +
  '<p>Technical SEO ensures search engines can properly crawl, index, and understand your site.</p>' +
  '<h2>Content Strategy</h2>' +
  '<p>A solid content strategy drives sustainable organic growth and audience engagement over time.</p>' +
  '<ol><li>Step one: research keywords</li><li>Step two: create content</li><li>Step three: build links</li></ol>' +
  '<a href="/related-post">Related Post</a>' +
  '<a href="/another-guide">Another Guide</a>' +
  '<a href="https://external-authority.com/source">External Source</a>' +
  '<img src="/images/seo.jpg" alt="SEO diagram">' +
  '<img src="/images/keywords.jpg" alt="Keyword research">' +
  '</body></html>';

const mockFetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  url: 'https://example.com/blog',
  headers: {
    get: jest.fn().mockReturnValue(null),
    entries: jest.fn().mockReturnValue([['content-type', 'text/html'], ['x-robots-tag', '']]),
    forEach: jest.fn(),
    raw: jest.fn().mockReturnValue({}),
  },
  text: jest.fn().mockResolvedValue(MOCK_HTML),
  json: jest.fn().mockResolvedValue({}),
});

// Support both `require('node-fetch')` and `(await import('node-fetch')).default`
mockFetch.default = mockFetch;
module.exports = mockFetch;
module.exports.default = mockFetch;
