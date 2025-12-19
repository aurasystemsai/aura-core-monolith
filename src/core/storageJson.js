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

module.exports = {
  readJson,
  writeJson,
};
