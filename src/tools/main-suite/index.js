"use strict";

const moduleGroups = require("./modules");

exports.meta = {
  id: "main-suite",
  name: "Main Suite",
  category: "Platform",
  description: "Unified suite entry point with grouped modules across analytics, workflows, SEO, personalization, and lifecycle.",
  version: "1.0.0",
};

exports.run = async function run() {
  // This tool is a lightweight aggregator; it simply returns the curated module groups.
  return {
    ok: true,
    modules: moduleGroups,
  };
};
