const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
const runsPath = path.join(dataDir, 'image-alt-media-seo-runs.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const readRuns = () => {
  if (!fs.existsSync(runsPath)) return [];
  try {
    const raw = fs.readFileSync(runsPath, 'utf-8');
    const json = JSON.parse(raw || '[]');
    return Array.isArray(json) ? json : [];
  } catch (err) {
    return [];
  }
};

const writeRuns = runs => {
  fs.writeFileSync(runsPath, JSON.stringify(runs.slice(-100), null, 2));
};

module.exports = {
  list: () => readRuns(),
  add: run => {
    const runs = readRuns();
    runs.push(run);
    writeRuns(runs);
    return run;
  }
};
