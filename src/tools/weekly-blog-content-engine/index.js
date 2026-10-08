"use strict";

exports.meta = {
  id: "weekly-blog-content-engine",
  name: "Weekly Blog Content Engine",
  category: "SEO / Content",
  description: "Plans a week of blog posts from your real products, existing posts and Google queries. Use the HTTP API for plans.",
  version: "3.0.0",
};

exports.run = async function run() {
  return { ok: true, tool: exports.meta.id, message: "Use /api/weekly-blog-content-engine/plan to create a plan." };
};
