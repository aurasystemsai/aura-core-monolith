// src/core/storageJson.js
const fs = require("fs/promises");
const path = require("path");

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readJson(filePath, fallbackValue) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (_err) {
    return fallbackValue;
  }
}

async function writeJson(filePath, value) {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  const raw = JSON.stringify(value, null, 2);
  await fs.writeFile(filePath, raw, "utf8");
}

// Alias get/set for compatibility with route usage
async function get(key, fallbackValue) {
  const filePath = path.join(__dirname, '../../data', `${key}.json`);
  return readJson(filePath, fallbackValue);
}

async function set(key, value) {
  const filePath = path.join(__dirname, '../../data', `${key}.json`);
  return writeJson(filePath, value);
}

module.exports = {
  readJson,
  writeJson,
  get,
  set,
};
