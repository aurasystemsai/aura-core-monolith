// Simple persistent shop token store using a JSON file (works on Render/local)
const fs = require('fs');
const path = require('path');

const TOKENS_FILE = process.env.SHOP_TOKENS_PATH || path.join(__dirname, '../../data/shop-tokens.json');

function loadTokens() {
	try {
		if (fs.existsSync(TOKENS_FILE)) {
			return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
		}
	} catch (e) {
		console.error('[shopTokens] Failed to load tokens:', e);
	}
	return {};
}

function saveTokens(tokens) {
	try {
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
};
