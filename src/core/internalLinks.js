'use strict';

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const pathOf = (url) => {
  try { return new URL(url, 'https://x.invalid').pathname.replace(/\/+$/, '') || '/'; } catch { return null; }
};

/** Internal link paths found in an HTML body (relative links or links on the shop's hosts). */
function extractInternalLinks(html, hosts) {
  const out = new Set();
  const re = /<a\b[^>]*\bhref\s*=\s*("([^"]*)"|'([^']*)')/gi;
  let m;
  while ((m = re.exec(html || ''))) {
    const href = (m[2] !== undefined ? m[2] : m[3]).trim();
    if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(href)) continue;
    if (/^https?:\/\//i.test(href)) {
      let u;
      try { u = new URL(href); } catch { continue; }
      if (!hosts.includes(u.hostname.toLowerCase())) continue;
    }
    const p = pathOf(href);
    if (p) out.add(p);
  }
  return out;
}

/** Split HTML into tag and text tokens, tracking whether a text token is safe to link inside. */
function tokenize(html) {
  const tokens = [];
  const re = /<[^>]*>|[^<]+/g;
  let m;
  const stack = [];
  const blocked = /^(a|h[1-6]|script|style|button|code|pre)$/i;
  while ((m = re.exec(html))) {
    const t = m[0];
    if (t.startsWith('<')) {
      const close = /^<\/\s*([a-z0-9]+)/i.exec(t);
      const open = /^<\s*([a-z0-9]+)/i.exec(t);
      if (close) {
        const i = stack.lastIndexOf(close[1].toLowerCase());
        if (i !== -1) stack.length = i;
      } else if (open && !/\/>$/.test(t) && !/^(br|img|hr|input|meta|link)$/i.test(open[1])) {
        stack.push(open[1].toLowerCase());
      }
      tokens.push({ tag: true, value: t });
    } else {
      tokens.push({ tag: false, value: t, linkable: !stack.some(s => blocked.test(s)) });
    }
  }
  return tokens;
}

/** Plain text of the linkable regions only. */
function linkableText(html) {
  return tokenize(html).filter(t => !t.tag && t.linkable).map(t => t.value).join(' ').replace(/\s+/g, ' ');
}

/** Wrap the first linkable, whole-word occurrence of `anchor` in an anchor tag. Returns null if none. */
function insertLink(html, anchor, href) {
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${escRe(anchor)})(?=$|[^\\p{L}\\p{N}])`, 'iu');
  const tokens = tokenize(html);
  let done = false;
  const safeHref = href.replace(/"/g, '%22');
  const out = tokens.map(t => {
    if (done || t.tag || !t.linkable) return t.value;
    const m = re.exec(t.value);
    if (!m) return t.value;
    done = true;
    const start = m.index + m[1].length;
    return `${t.value.slice(0, start)}<a href="${safeHref}">${m[2]}</a>${t.value.slice(start + m[2].length)}`;
  });
  return done ? out.join('') : null;
}

const STOP = new Set(['the', 'a', 'an', 'and', 'of', 'for', 'to', 'in', 'on', 'with', 'by']);

/** Candidate anchor phrases for a target, longest first. */
function anchorCandidates(entity) {
  const title = String(entity.title || '').replace(/\s+/g, ' ').trim();
  const out = [];
  if (title.split(' ').length >= 2 && title.length >= 6 && title.length <= 70) out.push(title);
  const words = title.split(' ').filter(w => !STOP.has(w.toLowerCase()));
  for (let n = Math.min(3, words.length); n >= 2; n--) {
    for (let i = 0; i + n <= words.length; i++) {
      const phrase = words.slice(i, i + n).join(' ');
      if (phrase.length >= 6 && !out.some(o => o.toLowerCase() === phrase.toLowerCase())) out.push(phrase);
    }
  }
  return out;
}

function analyzeLinks(entities, hosts) {
  const byPath = new Map();
  entities.forEach(e => byPath.set(pathOf(e.url), e));
  const outlinks = new Map();
  const inbound = new Map(entities.map(e => [e.url, []]));
  for (const e of entities) {
    const links = [...extractInternalLinks(e.html, hosts)].filter(p => byPath.has(p) && byPath.get(p) !== e);
    outlinks.set(e.url, links.map(p => byPath.get(p).url));
    links.forEach(p => inbound.get(byPath.get(p).url).push(e.url));
  }

  const nodes = entities.map(e => ({
    id: e.id, url: e.url, type: e.type, title: e.title, outbound: outlinks.get(e.url).length, inbound: inbound.get(e.url).length,
  }));

  const suggestions = [];
  const perTarget = new Map();
  const targets = [...nodes].sort((a, b) => a.inbound - b.inbound);
  for (const t of targets) {
    const target = entities.find(e => e.url === t.url);
    const cands = anchorCandidates(target);
    if (!cands.length) continue;
    for (const source of entities) {
      if (source === target || outlinks.get(source.url).includes(target.url)) continue;
      if ((perTarget.get(target.url) || 0) >= 5) break;
      const text = linkableText(source.html);
      const anchor = cands.find(c => new RegExp(`(^|[^\\p{L}\\p{N}])${escRe(c)}(?=$|[^\\p{L}\\p{N}])`, 'iu').test(text));
      if (!anchor) continue;
      const idx = text.toLowerCase().indexOf(anchor.toLowerCase());
      suggestions.push({
        sourceId: source.id, sourceUrl: source.url, sourceTitle: source.title, sourceType: source.type,
        targetId: target.id, targetUrl: target.url, targetTitle: target.title, anchor,
        context: text.slice(Math.max(0, idx - 60), idx + anchor.length + 60),
        targetInbound: t.inbound,
      });
      perTarget.set(target.url, (perTarget.get(target.url) || 0) + 1);
    }
  }

  const perSource = new Map();
  const limited = suggestions.filter(s => {
    const n = perSource.get(s.sourceUrl) || 0;
    if (n >= 3) return false;
    perSource.set(s.sourceUrl, n + 1);
    return true;
  });

  return {
    stats: {
      pages: nodes.length,
      totalLinks: nodes.reduce((n, x) => n + x.outbound, 0),
      withoutInbound: nodes.filter(n => n.inbound === 0).length,
      withoutOutbound: nodes.filter(n => n.outbound === 0).length,
    },
    nodes,
    suggestions: limited,
  };
}

module.exports = { analyzeLinks, extractInternalLinks, insertLink, linkableText, anchorCandidates, pathOf };

