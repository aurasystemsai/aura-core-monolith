// Simple persistent shop token store using a JSON file (works on Render/local)
const fs = require('fs');
const path = require('path');

// Keep local OAuth tokens out of the tracked sample file; production uses the persistent disk.
const dataDir = process.env.RENDER_DISK_PATH || path.join(__dirname, '../../data');
const tokenFileName = process.env.NODE_ENV === 'production' ? 'shop-tokens.json' : 'shop-tokens.local.json';
const TOKENS_FILE = process.env.SHOP_TOKENS_PATH || path.join(dataDir, tokenFileName);

function ensureDirExists(filePath) {
	const dir = path.dirname(filePath);
	try {
		fs.mkdirSync(dir, { recursive: true });
	} catch (e) {
		// If directory exists or cannot be created, log and continue
		console.error('[shopTokens] Failed to ensure directory:', dir, e.message);
	}
}

function loadTokens() {
	try {
		ensureDirExists(TOKENS_FILE);
		if (fs.existsSync(TOKENS_FILE)) {
			return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
		}
		// Auto-create an empty token file so first-time OAuth saves succeed without manual setup
		saveTokens({});
		return {};
	} catch (e) {
		console.error('[shopTokens] Failed to load tokens:', e);
	}
	return {};
}

// Internal helper for modules needing all tokens
function loadAllTokens() {
	return loadTokens();
}

function saveTokens(tokens) {
	try {
		ensureDirExists(TOKENS_FILE);
		fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf8');
	} catch (e) {
		console.error('[shopTokens] Failed to save tokens:', e);
	}
}

function upsertToken(shop, token) {
	if (!shop || !token) throw new Error('shop and token required');
	const tokens = loadTokens();
	tokens[shop] = { token, updated: new Date().toISOString() };
	saveTokens(tokens);
}

function getToken(shop) {
	if (!shop) return null;
	const tokens = loadTokens();
	return tokens[shop]?.token || null;
}

module.exports = {
	upsertToken,
	getToken,
	loadAll: loadAllTokens,
	_loadAll: loadAllTokens,
};
