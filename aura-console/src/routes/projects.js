import express from "express";
import crypto from "crypto";

const router = express.Router();

// TEMP: In-memory projects store for testing (replace with DB later)
const projects = [];

/**
 * POST /projects
 * Create a new project (manual or Shopify)
 */
router.post("/", (req, res) => {
  const { name, domain, platform } = req.body;

  if (!name || !domain || !platform) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const id = `proj_${crypto.randomBytes(6).toString("hex")}`;

  const project = {
    id,
    name,
    domain,
    platform,
    createdAt: new Date().toISOString(),
  };

  projects.push(project);
  res.json(project);
});

/**
 * GET /projects/:id
 * Retrieve existing project by ID
 */
router.get("/:id", (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Not found" });
  res.json(project);
});

export default router;
