// src/tools/weekly-blog-content-engine/index.js
// ------------------------------------------------------
// Weekly Blog Content Engine (deterministic, offline)
// Generates a weekly content plan with SEO-ready post metadata.
// ------------------------------------------------------

"use strict";

exports.meta = {
  id: "weekly-blog-content-engine",
  name: "Weekly Blog Content Engine",
  category: "SEO / Content",
  description:
    "Generate a deterministic weekly content plan with SEO-ready blog titles, meta descriptions, slugs and primary keywords without external APIs.",
  version: "2.0.0",
};

const SAMPLE_TOPICS = [
  "Scaling content velocity",
  "Optimising blog distribution",
  "Revenue-focused storytelling",
  "Data-backed SEO experiments",
  "Thought leadership flywheels",
  "Channel attribution for content",
];

const SAMPLE_ANGLES = [
  "Playbook",
  "Benchmark",
  "Checklist",
  "Case study",
  "Tactical guide",
  "Retro",
];

const SAMPLE_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function seededRandom(seed) {
  let hash = (seed || "weekly-blog").split("").reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 42);
  return () => {
    hash = (hash * 1664525 + 1013904223) % 4294967296;
    return hash / 4294967296;
  };
}

function pick(list, rand) {
  const idx = Math.floor(rand() * list.length);
  return list[idx];
}

function toSlug(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

function buildPost(seedFn, base, index) {
  const topic = pick(SAMPLE_TOPICS, seedFn);
  const angle = pick(SAMPLE_ANGLES, seedFn);
  const day = SAMPLE_DAYS[index % SAMPLE_DAYS.length];
  const title = `${base.brand || base.niche || "Weekly"}: ${topic} (${angle})`;
  const primaryKeyword = `${base.niche || base.brand || "blog"} ${angle}`.toLowerCase();
  const metaDescription = `${title} — practical steps, examples, and metrics to execute a ${base.cadence} cadence for ${base.audience}.`.slice(0, 150);
  return {
    title,
    metaDescription,
    slug: toSlug(title),
    primaryKeyword,
    angle,
    suggestedDate: `${day}, Week ${base.weekNumber}`,
  };
}

function buildPlan(payload) {
  const base = {
    brand: payload.brand || "",
    niche: payload.niche || "",
    audience: payload.audience || "Marketing teams",
    cadence: payload.cadence || "weekly",
    themes: payload.themes || "SEO + distribution",
    tone: payload.tone || "Confident, concise",
    market: payload.market || "Worldwide",
    weekNumber: payload.weekNumber || 1,
  };

  const rand = seededRandom(`${base.brand}-${base.niche}-${base.cadence}`);
  const postCount = 4;
  const posts = Array.from({ length: postCount }).map((_, idx) => buildPost(rand, base, idx));
  const focus = base.brand || base.niche || "the program";

  return {
    summary: `Weekly plan for ${focus}: ${base.themes}. Tone: ${base.tone}. Market: ${base.market}.`,
    posts,
  };
}

exports.run = async function run(input = {}, ctx = {}) {
  const {
    brand = "",
    niche = "",
    audience = "",
    cadence = "weekly",
    themes = "SEO and distribution",
    tone = "Confident, concise",
    market = "Worldwide",
    weekNumber = 1,
  } = input || {};

  if (!brand && !niche) {
    throw new Error("At least brand or niche is required for Weekly Blog Content Engine");
  }

  const plan = buildPlan({ brand, niche, audience, cadence, themes, tone, market, weekNumber });
  const titleLens = plan.posts.map((p) => p.title.length);
  const metaLens = plan.posts.map((p) => p.metaDescription.length);
  const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

  return {
    input,
    output: {
      summary: plan.summary,
      posts: plan.posts,
      stats: {
        avgTitleLength: avg(titleLens),
        avgMetaLength: avg(metaLens),
        postCount: plan.posts.length,
      },
    },
    model: "deterministic-offline",
    environment: ctx.environment || "offline",
  };
};
