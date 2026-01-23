const fs = require('fs');
const path = require('path');

const DATA_PATH = process.env.KLAVIYO_BRANDS_PATH || path.join(__dirname, '../../data/klaviyo-brands.json');

function ensureDirSync(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

function save(items) {
  ensureDirSync(DATA_PATH);
  fs.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2), 'utf8');
}

let brands = load();
let idCounter = brands.reduce((m, e) => Math.max(m, Number(e.id) || 0), 0) + 1;

module.exports = {
  list: () => brands,
  get: (id) => brands.find(b => b.id == id),
  create: (data = {}) => {
    const brand = { id: idCounter++, name: data.name || `Brand ${idCounter}`, domains: data.domains || [], createdAt: Date.now(), ...data };
    brands.push(brand);
    save(brands);
    return brand;
  },
  update: (id, data = {}) => {
    const idx = brands.findIndex(b => b.id == id);
    if (idx === -1) return null;
    brands[idx] = { ...brands[idx], ...data, updatedAt: Date.now() };
    save(brands);
    return brands[idx];
  },
  delete: (id) => {
    const idx = brands.findIndex(b => b.id == id);
    if (idx === -1) return false;
    brands.splice(idx, 1);
    save(brands);
    return true;
  },
  clear: () => { brands = []; save(brands); },
};
