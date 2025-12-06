// src/tools/inventory-supplier-sync/index.js
// ------------------------------------------
// Simple diff between store stock and supplier stock
// ------------------------------------------

module.exports = {
  key: "inventory-supplier-sync",
  name: "Inventory & Supplier Sync",

  async run(input = {}, ctx = {}) {
    const storeItems = Array.isArray(input.store) ? input.store : [];
    const supplierItems = Array.isArray(input.supplier) ? input.supplier : [];

    const supplierMap = new Map();
    supplierItems.forEach((i) => supplierMap.set(i.sku, i));

    const diffs = storeItems.map((item) => {
      const sup = supplierMap.get(item.sku) || {};
      const storeQty = Number(item.qty || item.quantity || 0);
      const supQty = Number(sup.qty || sup.quantity || 0);
      return {
        sku: item.sku,
        store_qty: storeQty,
        supplier_qty: supQty,
        delta: supQty - storeQty,
      };
    });

    return {
      ok: true,
      tool: "inventory-supplier-sync",
      diffs,
    };
  },
};
