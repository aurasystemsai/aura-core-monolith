// Campaign data model for Abandoned Checkout Winback
// This is a simple in-memory model for now; replace with DB integration later.

const campaigns = [];

function createCampaign(data) {
  const campaign = { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() };
  campaigns.push(campaign);
  return campaign;
}

function listCampaigns() {
  return campaigns;
}

function getCampaign(id) {
  return campaigns.find(c => c.id === id);
}

function updateCampaign(id, data) {
  const idx = campaigns.findIndex(c => c.id === id);
  if (idx === -1) return null;
  campaigns[idx] = { ...campaigns[idx], ...data };
  return campaigns[idx];
}

function deleteCampaign(id) {
  const idx = campaigns.findIndex(c => c.id === id);
  if (idx === -1) return false;
  campaigns.splice(idx, 1);
  return true;
}

module.exports = { createCampaign, listCampaigns, getCampaign, updateCampaign, deleteCampaign };
