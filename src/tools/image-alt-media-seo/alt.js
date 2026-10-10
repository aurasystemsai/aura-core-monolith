'use strict';

// Alt-text helpers shared by the merchant screen and the scheduled drafts job.
const { gql } = require('../../core/seoStoreData');

const MODEL = 'gpt-4o-mini';
const PAGE = 25;
const MAX_ALT = 125;

// Why an alt text is poor, or '' when it is fine.
function judge(alt) {
  const a = String(alt || '').trim();
  if (!a) return 'missing';
  if (/\.(jpe?g|png|webp|gif|avif)$/i.test(a) || (/^(img|dsc|image|photo|screenshot)[-_ ]?\d*/i.test(a) && a.length < 14)) return 'filename';
  if (a.length < 10) return 'short';
  if (a.length > MAX_ALT) return 'long';
  return '';
}

const QUERY = `query($first:Int!,$after:String){ products(first:$first, after:$after, query:"status:active"){
  pageInfo{hasNextPage endCursor}
  nodes{ id title media(first:20){ nodes{ ... on MediaImage{ id alt image{ url(transform:{maxWidth:800}) } } } } } } }`;

async function loadImages(shop, token, after) {
  const d = await gql(shop, token, QUERY, { first: PAGE, after: after || null });
  const images = [];
  for (const p of d.products.nodes) {
    (p.media.nodes || []).filter((m) => m && m.id && m.image).forEach((m, i) => {
      images.push({ id: m.id, productId: p.id, productTitle: p.title, position: i + 1, url: m.image.url, alt: m.alt || '', problem: judge(m.alt) });
    });
  }
  return { images, hasMore: d.products.pageInfo.hasNextPage, cursor: d.products.pageInfo.endCursor };
}

function clean(text) {
  let t = String(text || '').replace(/^["'\s]+|["'\s]+$/g, '').replace(/^(an? )?(image|photo|picture) of /i, '').replace(/\s+/g, ' ');
  if (t.length > MAX_ALT) t = t.slice(0, MAX_ALT).replace(/\s+\S*$/, '');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// One AI description of one image. Returns '' when the model gave nothing usable.
async function describeImage(client, url, hint) {
  const resp = await client.chat.completions.create({
    model: MODEL, temperature: 0.2, max_tokens: 60,
    messages: [{ role: 'user', content: [
      { type: 'text', text: `Write alt text for this product image${hint ? ` (product: ${String(hint).slice(0, 120)})` : ''}. Describe what is actually visible in one plain sentence under 110 characters: the item, colour, and anything that sets it apart. Do not start with "image of" or "photo of". Do not invent brand names. Reply with the alt text only.` },
      { type: 'image_url', image_url: { url, detail: 'low' } },
    ] }],
  });
  return clean(resp.choices[0].message.content);
}

module.exports = { MODEL, MAX_ALT, judge, loadImages, clean, describeImage };
