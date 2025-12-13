// src/core/projects.js
// --------------------------------------------------
// Project / store management for AURA Core
// --------------------------------------------------

const express = require("express");
const router = express.Router();

// In-memory store for now. Later you can replace with a DB.
const projects = [];

/**
 * Normalise storefront domain so we don't end up with
 * aurasystemsai.com, https://aurasystemsai.com, etc. as duplicates.
 */
function normaliseDomain(domain = "") {
  let value = String(domain).trim();
  if (!value) return "";

  // Strip protocol
  value = value.replace(/^https?:\/\//i, "");

  // Strip trailing slashes
  value = value.replace(/\/+$/, "");

  return value.toLowerCase();
}

/**
 * POST /projects
 * Body: { name: string, domain: string, platform?: string }
 *
 * Used by the Connect Store screen to either create or re-use a project.
 */
router.post("/projects", (req, res) => {
  const { name, domain, platform } = req.body || {};

  if (!name || !domain) {
    return res
      .status(400)
      .json({ ok: false, error: "Project name and storefront domain are required." });
  }

  const normalisedDomain = normaliseDomain(domain);

  // Try to reuse existing project by domain
  let project = projects.find((p) => p.domain === normalisedDomain);

  if (!project) {
    project = {
      id:
        "proj_" +
        Math.random().toString(36).slice(2, 9) +
        Date.now().toString(36),
      name: name.trim(),
      domain: normalisedDomain,
      platform: (platform || "other").toLowerCase(),
      createdAt: new Date().toISOString(),
    };

    projects.push(project);
  } else {
    // Update basic fields if user reconnects
    project.name = name.trim();
    project.platform = (platform || project.platform || "other").toLowerCase();
  }

  return res.json({
    ok: true,
    id: project.id,
    name: project.name,
    domain: project.domain,
    platform: project.platform,
  });
});

/**
 * GET /projects
 * Simple list endpoint – useful later for the Project Switcher.
 */
router.get("/projects", (req, res) => {
  res.json({
    ok: true,
    projects,
  });
});

module.exports = router;
