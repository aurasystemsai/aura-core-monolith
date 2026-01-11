// Shopify integration for fetching abandoned checkouts (mock)
async function fetchAbandonedCheckouts({ shop, token, apiVersion }) {
  // In production, call Shopify API here
  return [
    { id: '1', customer: 'Alice', items: [{ name: 'T-shirt', quantity: 2 }], abandonedAt: Date.now() - 86400000 },
    { id: '2', customer: 'Bob', items: [{ name: 'Shoes', quantity: 1 }], abandonedAt: Date.now() - 43200000 }
  ];
}

module.exports = { fetchAbandonedCheckouts };
