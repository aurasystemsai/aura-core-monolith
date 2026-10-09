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

module.exports = router;