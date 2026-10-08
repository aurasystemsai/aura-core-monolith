const { assertPublicUrl } = require('../core/shopifyContentFetcher');

describe('assertPublicUrl (SSRF guard)', () => {
  test.each([
    'http://127.0.0.1/', 'http://169.254.169.254/latest/meta-data', 'http://[::1]/',
    'http://[::ffff:10.0.0.1]/', 'file:///etc/passwd', 'ftp://example.com', 'http://localhost:3000',
    'http://10.0.0.5', 'http://192.168.1.1', 'http://172.16.0.1', 'http://user:pw@example.com', 'not a url',
  ])('blocks %s', async (u) => {
    await expect(assertPublicUrl(u)).rejects.toThrow();
  });
  test('allows public https', async () => {
    await expect(assertPublicUrl('https://example.com/blogs/news/a')).resolves.toBeUndefined();
  });
});
