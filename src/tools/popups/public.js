'use strict';

// Public storefront side of Popups & Email Capture. No login, so every input is validated and limited.
// Mounted at /storefront. A shop must have AURA installed (a stored token) before anything is read or saved.
const express = require('express');
const crypto = require('crypto');
const shopTokens = require('../../core/shopTokens');
const store = require('../../core/shopStore');
const mailer = require('../../core/mailer');
const { rateLimit } = require('../../core/rateLimit');
const backInStock = require('../back-in-stock/router');

const router = express.Router();
const SHOP = /^[a-z0-9][a-z0-9-]{0,60}\.myshopify\.com$/;
const MAX_LEADS = 5000;

router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
if (process.env.NODE_ENV !== 'test') router.use(rateLimit({ max: 40, keyFn: (req) => req.ip }));

function shopOf(raw) {
  const s = String(raw || '').toLowerCase().trim();
  return SHOP.test(s) && shopTokens.getToken(s) ? s : null;
}
const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

// Only what a shopper needs to see. Nothing about leads, stats or other popups' internals.
router.get('/popups', (req, res) => {
  const shop = shopOf(req.query.shop);
  if (!shop) return res.json({ ok: true, popups: [] });
  const popups = store.read('popups', shop, []).filter((p) => p.active).map((p) => ({
    id: p.id, type: p.type, trigger: p.trigger, delaySeconds: p.delaySeconds,
    headline: p.headline, body: p.body, button: p.button, discountCode: p.discountCode,
  }));
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ ok: true, popups });
});

router.post('/subscribe', (req, res) => {
  const b = req.body || {};
  const shop = shopOf(b.shop);
  if (!shop) return res.status(400).json({ ok: false, error: 'Unknown shop.' });
  if (b.website) return res.json({ ok: true }); // hidden field only bots fill in
  const email = clean(b.email, 254).toLowerCase();
  if (!mailer.isEmail(email)) return res.status(400).json({ ok: false, error: 'Enter a valid email address.' });
  const popups = store.read('popups', shop, []);
  const popup = popups.find((p) => p.id === b.popupId && p.active && p.type === 'email');
  if (!popup) return res.status(404).json({ ok: false, error: 'This signup is no longer available.' });
  const leads = store.read('popup-leads', shop, []);
  if (leads.some((l) => l.email === email)) return res.json({ ok: true, discountCode: popup.discountCode || null });
  if (leads.length >= MAX_LEADS) return res.status(429).json({ ok: false, error: 'Signups are paused for now.' });
  store.write('popup-leads', shop, [{ id: crypto.randomUUID(), email, popupId: popup.id, popup: popup.name, at: new Date().toISOString() }, ...leads]);
  popup.signups = (popup.signups || 0) + 1;
  store.write('popups', shop, popups);
  res.json({ ok: true, discountCode: popup.discountCode || null });
});

router.post('/back-in-stock', async (req, res) => {
  const b = req.body || {};
  const shop = shopOf(b.shop);
  if (!shop) return res.status(400).json({ ok: false, error: 'Unknown shop.' });
  const id = String(b.variantId || '').replace(/\D/g, '').slice(0, 20);
  try {
    await backInStock.subscribe(shop, shopTokens.getToken(shop), { email: b.email, variantId: `gid://shopify/ProductVariant/${id}`, consent: b.consent === true });
    res.json({ ok: true });
  } catch (e) {
    res.status(e.status || 500).json({ ok: false, error: e.status ? e.message : 'Something went wrong. Try again.' });
  }
});

// The script is static. It reads the shop from the Shopify page it runs on and builds everything with textContent.
const SCRIPT = `(function(){
  var s=document.currentScript,origin=new URL(s.src).origin,shop=window.Shopify&&window.Shopify.shop;
  if(!shop||window.__auraPopups)return;window.__auraPopups=1;
  var KEY='aura_popup_';
  function seen(id){try{return Date.now()-Number(localStorage.getItem(KEY+id)||0)<6048e5}catch(e){return false}}
  function mark(id){try{localStorage.setItem(KEY+id,String(Date.now()))}catch(e){}}
  function el(t,css,txt){var e=document.createElement(t);if(css)e.style.cssText=css;if(txt!=null)e.textContent=txt;return e}
  function show(p){
    if(document.getElementById('aura-popup'))return;
    var wrap=el('div','position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px');
    wrap.id='aura-popup';
    var box=el('div','background:#fff;color:#111;max-width:420px;width:100%;border-radius:12px;padding:28px;font-family:Arial,sans-serif;position:relative;box-sizing:border-box');
    var close=el('button','position:absolute;top:8px;right:12px;border:0;background:none;font-size:24px;cursor:pointer;color:#666','\\u00d7');
    close.setAttribute('aria-label','Close');
    function done(){mark(p.id);wrap.remove()}
    close.onclick=done;wrap.onclick=function(e){if(e.target===wrap)done()};
    box.appendChild(close);
    box.appendChild(el('h2','margin:0 0 8px;font-size:22px',p.headline));
    if(p.body)box.appendChild(el('p','margin:0 0 16px;font-size:14px;line-height:1.5;color:#444',p.body));
    var msg=el('p','margin:10px 0 0;font-size:13px;color:#b00020');
    if(p.type==='email'){
      var inp=el('input','width:100%;padding:11px;border:1px solid #ccc;border-radius:6px;font-size:14px;box-sizing:border-box;margin-bottom:10px');
      inp.type='email';inp.placeholder='Your email';inp.setAttribute('aria-label','Your email');
      var hp=el('input','position:absolute;left:-9999px');hp.tabIndex=-1;hp.autocomplete='off';hp.name='website';
      var btn=el('button','width:100%;padding:12px;border:0;border-radius:6px;background:#111;color:#fff;font-size:15px;cursor:pointer',p.button);
      box.appendChild(inp);box.appendChild(hp);box.appendChild(btn);
      box.appendChild(el('p','margin:10px 0 0;font-size:11px;color:#777','By subscribing you agree to get marketing emails from us. You can unsubscribe any time.'));
      btn.onclick=function(){
        btn.disabled=true;msg.textContent='';
        fetch(origin+'/storefront/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({shop:shop,popupId:p.id,email:inp.value,website:hp.value})})
          .then(function(r){return r.json()}).then(function(r){
            if(!r.ok){btn.disabled=false;msg.textContent=r.error||'Something went wrong.';return}
            mark(p.id);box.textContent='';box.appendChild(close);
            box.appendChild(el('h2','margin:0 0 8px;font-size:22px','Thanks, you are on the list.'));
            if(r.discountCode){box.appendChild(el('p','margin:0 0 8px;font-size:14px','Your code:'));box.appendChild(el('p','margin:0;font-size:20px;font-weight:700;letter-spacing:1px',r.discountCode))}
          }).catch(function(){btn.disabled=false;msg.textContent='Could not reach the server. Try again.'});
      };
    }else{
      var ok=el('button','padding:11px 20px;border:0;border-radius:6px;background:#111;color:#fff;font-size:15px;cursor:pointer',p.button);
      ok.onclick=done;box.appendChild(ok);
    }
    box.appendChild(msg);wrap.appendChild(box);document.body.appendChild(wrap);
  }
  function arm(p){
    if(seen(p.id))return;
    if(p.trigger==='exit'){document.addEventListener('mouseout',function f(e){if(!e.relatedTarget&&e.clientY<=0){document.removeEventListener('mouseout',f);show(p)}})}
    else if(p.trigger==='scroll'){window.addEventListener('scroll',function f(){var h=document.documentElement;if((h.scrollTop+window.innerHeight)/h.scrollHeight>.5){window.removeEventListener('scroll',f);show(p)}})}
    else setTimeout(function(){show(p)},p.delaySeconds*1000);
  }
  fetch(origin+'/storefront/popups?shop='+encodeURIComponent(shop)).then(function(r){return r.json()}).then(function(r){
    var list=(r&&r.popups)||[];if(list[0])arm(list[0]);
  }).catch(function(){});
})();`;
router.get('/popup.js', (req, res) => {
  res.set('Content-Type', 'application/javascript; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=300');
  res.send(SCRIPT);
});

// First active guide for the product type on the page (a guide set to "all" matches any product).
router.get('/size-guide', (req, res) => {
  const shop = shopOf(req.query.shop);
  if (!shop) return res.json({ ok: true, guide: null });
  const type = String(req.query.type || '').toLowerCase().trim().slice(0, 60);
  const guides = store.read('size-guides', shop, []).filter((g) => g.active);
  const g = guides.find((x) => type && x.match.toLowerCase() === type) || guides.find((x) => x.match.toLowerCase() === 'all');
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ ok: true, guide: g ? { title: g.title, note: g.note, columns: g.columns, rows: g.rows } : null });
});

// Whether a variant is sold out right now, so the product page knows to offer the alert form.
router.get('/stock', async (req, res) => {
  const shop = shopOf(req.query.shop);
  if (!shop) return res.json({ ok: true, soldOut: false });
  const id = String(req.query.variantId || '').replace(/\D/g, '').slice(0, 20);
  try {
    res.json({ ok: true, soldOut: !!id && await backInStock.soldOut(shop, shopTokens.getToken(shop), `gid://shopify/ProductVariant/${id}`) });
  } catch { res.json({ ok: true, soldOut: false }); }
});

const SIZE_SCRIPT = `(function(){
  var s=document.currentScript,origin=new URL(s.src).origin,shop=window.Shopify&&window.Shopify.shop;
  var m=window.ShopifyAnalytics&&window.ShopifyAnalytics.meta,p=m&&m.product;
  if(!shop||!p||window.__auraSize)return;window.__auraSize=1;
  function el(t,css,txt){var e=document.createElement(t);if(css)e.style.cssText=css;if(txt!=null)e.textContent=txt;return e}
  fetch(origin+'/storefront/size-guide?shop='+encodeURIComponent(shop)+'&type='+encodeURIComponent(p.type||'')).then(function(r){return r.json()}).then(function(r){
    var g=r&&r.guide;if(!g)return;
    var btn=el('button','margin:12px 0;padding:8px 14px;border:1px solid #111;background:#fff;color:#111;border-radius:6px;cursor:pointer;font-size:14px',g.title);
    btn.type='button';
    btn.onclick=function(){
      var wrap=el('div','position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px');
      var box=el('div','background:#fff;color:#111;max-width:560px;width:100%;max-height:85vh;overflow:auto;border-radius:12px;padding:24px;font-family:Arial,sans-serif;box-sizing:border-box');
      var x=el('button','float:right;border:0;background:none;font-size:24px;cursor:pointer','\\u00d7');x.setAttribute('aria-label','Close');
      x.onclick=function(){wrap.remove()};wrap.onclick=function(e){if(e.target===wrap)wrap.remove()};
      box.appendChild(x);box.appendChild(el('h2','margin:0 0 12px;font-size:20px',g.title));
      var t=el('table','width:100%;border-collapse:collapse;font-size:14px'),h=el('tr');
      g.columns.forEach(function(c){h.appendChild(el('th','border-bottom:2px solid #111;padding:6px;text-align:left',c))});t.appendChild(h);
      g.rows.forEach(function(row){var tr=el('tr');row.forEach(function(c){tr.appendChild(el('td','border-bottom:1px solid #ddd;padding:6px',c))});t.appendChild(tr)});
      box.appendChild(t);if(g.note)box.appendChild(el('p','margin:12px 0 0;font-size:12px;color:#555',g.note));
      wrap.appendChild(box);document.body.appendChild(wrap);
    };
    var form=document.querySelector('form[action*="/cart/add"]');
    (form&&form.parentNode?form.parentNode:document.body).insertBefore(btn,form||null);
  }).catch(function(){});
})();`;
router.get('/size-guide.js', (req, res) => {
  res.set('Content-Type', 'application/javascript; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=300');
  res.send(SIZE_SCRIPT);
});

const STOCK_SCRIPT = `(function(){
  var s=document.currentScript,origin=new URL(s.src).origin,shop=window.Shopify&&window.Shopify.shop;
  var m=window.ShopifyAnalytics&&window.ShopifyAnalytics.meta;
  if(!shop||!m||!m.product||window.__auraStock)return;window.__auraStock=1;
  function el(t,css,txt){var e=document.createElement(t);if(css)e.style.cssText=css;if(txt!=null)e.textContent=txt;return e}
  var shown=null;
  function check(){
    var v=(new URL(location.href).searchParams.get('variant'))||m.selectedVariantId||(m.product.variants&&m.product.variants[0]&&m.product.variants[0].id);
    if(!v||v===shown)return;shown=v;
    var old=document.getElementById('aura-bis');if(old)old.remove();
    fetch(origin+'/storefront/stock?shop='+encodeURIComponent(shop)+'&variantId='+encodeURIComponent(v)).then(function(r){return r.json()}).then(function(r){
      if(!r||!r.soldOut||shown!==v)return;
      var box=el('div','margin:12px 0;padding:14px;border:1px solid #ddd;border-radius:8px;font-family:inherit');box.id='aura-bis';
      box.appendChild(el('p','margin:0 0 8px;font-weight:600','Sold out. Email me when it is back.'));
      var inp=el('input','padding:9px;border:1px solid #ccc;border-radius:6px;width:100%;box-sizing:border-box;margin-bottom:8px');inp.type='email';inp.placeholder='Your email';inp.setAttribute('aria-label','Your email');
      var btn=el('button','padding:9px 16px;border:0;border-radius:6px;background:#111;color:#fff;cursor:pointer','Notify me');btn.type='button';
      var msg=el('p','margin:8px 0 0;font-size:13px');
      box.appendChild(inp);box.appendChild(btn);box.appendChild(el('p','margin:8px 0 0;font-size:11px;color:#777','We will email you once about this item.'));box.appendChild(msg);
      btn.onclick=function(){btn.disabled=true;msg.textContent='';
        fetch(origin+'/storefront/back-in-stock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({shop:shop,variantId:v,email:inp.value,consent:true})})
          .then(function(r){return r.json()}).then(function(r){
            if(r.ok){box.textContent='';box.appendChild(el('p','margin:0;font-weight:600','Thanks, we will email you when it is back.'));return}
            btn.disabled=false;msg.style.color='#b00020';msg.textContent=r.error||'Something went wrong.';
          }).catch(function(){btn.disabled=false;msg.textContent='Could not reach the server. Try again.'});};
      var form=document.querySelector('form[action*="/cart/add"]');
      if(form&&form.parentNode)form.parentNode.insertBefore(box,form.nextSibling);else document.body.appendChild(box);
    }).catch(function(){});
  }
  check();setInterval(check,1500);
})();`;
router.get('/back-in-stock.js', (req, res) => {
  res.set('Content-Type', 'application/javascript; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=300');
  res.send(STOCK_SCRIPT);
});
module.exports = router;