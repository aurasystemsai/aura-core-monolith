const ClusteringEngine = require('./clustering-engine');

describe('Keyword Clustering Engine', () => {
  let engine;

  beforeEach(() => {
    engine = new ClusteringEngine();
  });

  test('clusters connected semantic variations deterministically and reports smaller groups', async () => {
    const first = await engine.createClusters({
      method: 'semantic',
      minClusterSize: 2,
      keywords: ['red shoes', 'red shoes women', 'shoes women', 'ceramic mug'],
    });
    const second = await engine.createClusters({
      method: 'semantic',
      minClusterSize: 2,
      keywords: ['red shoes', 'red shoes women', 'shoes women', 'ceramic mug'],
    });

    expect(first.clusters.map(cluster => cluster.keywords)).toEqual([
      ['red shoes', 'red shoes women', 'shoes women'],
    ]);
    expect(first.unclusteredKeywords).toEqual(['ceramic mug']);
    expect(first.clusters[0].totalSearchVolume).toBeNull();
    expect(first.clusters[0].avgDifficulty).toBeNull();
    expect(second.clusters.map(cluster => cluster.keywords)).toEqual(first.clusters.map(cluster => cluster.keywords));
  });

  test('deduplicates case and whitespace variants before clustering', async () => {
    const result = await engine.createClusters({
      keywords: ['  SEO tools ', 'seo   tools', 'SEO tools'],
      minClusterSize: 1,
    });

    expect(result.totalKeywords).toBe(1);
    expect(result.clusters[0].keywords).toEqual(['SEO tools']);
  });

  test('rejects invalid input and unsupported methods', async () => {
    await expect(engine.createClusters({ keywords: [] })).rejects.toThrow('keywords must be a non-empty array');
    await expect(engine.createClusters({ keywords: ['valid'], minClusterSize: 0 })).rejects.toThrow('minClusterSize must be a positive integer');
    await expect(engine.createClusters({ keywords: ['valid'], method: 'random' })).rejects.toThrow('Unsupported clustering method');
  });

  test('requires actual SERP data and groups by shared domains', async () => {
    await expect(engine.createClusters({ keywords: ['alpha', 'beta'], method: 'serp' }))
      .rejects.toThrow('SERP clustering requires real SERP data');

    const result = await engine.createClusters({
      method: 'serp',
      minClusterSize: 2,
      keywords: ['alpha', 'beta', 'gamma'],
      serpData: {
        alpha: { topDomains: ['example.com', 'shop.com'], features: ['snippets', 'images'] },
        beta: { topDomains: ['example.com', 'shop.com'], features: ['snippets'] },
        gamma: { topDomains: ['elsewhere.com'], features: ['local'] },
      },
    });

    expect(result.clusters).toHaveLength(1);
    expect(result.clusters[0].keywords).toEqual(['alpha', 'beta']);
    expect(result.clusters[0].commonDomains).toEqual(['example.com', 'shop.com']);
    expect(result.unclusteredKeywords).toEqual(['gamma']);
  });

  test('classifies search intent with purchase intent taking precedence', () => {
    expect(engine.classifyIntent('how to buy running shoes')).toBe('transactional');
    expect(engine.classifyIntent('best running shoes review')).toBe('commercial');
    expect(engine.classifyIntent('how to clean shoes')).toBe('informational');
    expect(engine.classifyIntent('official site login')).toBe('navigational');
  });

  test('retrieves nested clusters for suggestions and merging', async () => {
    const first = await engine.createClusters({
      keywords: ['red shoes', 'red shoes women'],
      minClusterSize: 2,
    });
    const second = await engine.createClusters({
      keywords: ['blue shoes', 'blue shoes women'],
      minClusterSize: 2,
    });

    const suggestions = await engine.getClusterSuggestions(first.clusters[0].id);
    expect(suggestions.contentSuggestions[0].sections).toEqual(first.clusters[0].keywords);

    const merged = await engine.mergeClusters([first.clusters[0].id, second.clusters[0].id]);
    expect(merged.keywords).toEqual(['red shoes', 'red shoes women', 'blue shoes', 'blue shoes women']);
  });
});
