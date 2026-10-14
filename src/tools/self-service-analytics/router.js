'use strict';

// Reports use only the shop's recent Shopify orders. No traffic, attribution, or forecasts are inferred.
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { gql } = require('../../core/seoStoreData');

const router = express.Router();
const MAX_DAYS = 60;
const PAGE_SIZE = 250;
const MAX_PAGES = 10;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try {
      await handler(req, res, ctx);
    } catch (err) {
      if (/access denied|required access/i.test(err.message)) {
        return res.status(403).json({ ok: false, needsScopes: true, error: 'Reports need permission to read your recent orders. Approve the updated permissions for AURA in your Shopify admin, then try again.' });
      }
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  };
}

function dateRange(query) {
  const end = String(query.end || '');
  const start = String(query.start || '');
  const valid = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`)) && new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d;
  if (!valid(start) || !valid(end)) {
    const e = new Error('Choose a valid start and end date.');
    e.status = 400;
    throw e;
  }
  const days = Math.floor((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1;
  if (days < 1) {
    const e = new Error('The end date must be on or after the start date.');
    e.status = 400;
    throw e;
  }
  if (days > MAX_DAYS) {
    const e = new Error(`Choose a date range of ${MAX_DAYS} days or less. Shopify only exposes recent order history to this app.`);
    e.status = 400;
    throw e;
  }
  return { start, end, days };
}

async function getOrders(shop, token, { start, end }) {
  const endExclusive = new Date(Date.parse(`${end}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
  const query = `created_at:>=${start} created_at:<${endExclusive}`;
  const orders = [];
  let after = null;
  let hasNextPage = true;
  let pages = 0;
  while (hasNextPage && pages < MAX_PAGES) {
    const d = await gql(shop, token, `query($query:String!, $after:String){ orders(first:${PAGE_SIZE}, query:$query, sortKey:CREATED_AT, reverse:true, after:$after){ nodes{ id createdAt cancelledAt displayFinancialStatus customer{ id } currentSubtotalPriceSet{ shopMoney{ amount currencyCode } } } pageInfo{ hasNextPage endCursor } } }`, { query, after });
    const page = d.orders;
    orders.push(...page.nodes);
    hasNextPage = page.pageInfo.hasNextPage;
    after = page.pageInfo.endCursor;
    pages += 1;
  }
  return { orders, truncated: hasNextPage };
}

function summarize(orders, range) {
  const active = orders.filter((o) => !o.cancelledAt);
  const daily = new Map();
  const statuses = new Map();
  const customers = new Set();
  let sales = 0;
  let currency = '';
  for (const order of active) {
    const amount = Number(order.currentSubtotalPriceSet.shopMoney.amount) || 0;
    currency = currency || order.currentSubtotalPriceSet.shopMoney.currencyCode;
    sales += amount;
    const date = order.createdAt.slice(0, 10);
    const day = daily.get(date) || { date, orders: 0, sales: 0 };
    day.orders += 1;
    day.sales += amount;
    daily.set(date, day);
    if (order.customer && order.customer.id) customers.add(order.customer.id);
    const status = order.displayFinancialStatus || 'UNKNOWN';
    statuses.set(status, (statuses.get(status) || 0) + 1);
  }
  const money = (n) => Math.round(n * 100) / 100;
  const days = [];
  for (let n = 0; n < range.days; n += 1) {
    const date = new Date(Date.parse(`${range.start}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
    const row = daily.get(date) || { date, orders: 0, sales: 0 };
    days.push({ ...row, sales: money(row.sales) });
  }
  return {
    range,
    summary: {
      orders: active.length,
      cancelledOrders: orders.length - active.length,
      netSubtotal: money(sales),
      averageOrderValue: active.length ? money(sales / active.length) : 0,
      purchasingCustomers: customers.size,
      currency,
    },
    daily: days,
    financialStatuses: [...statuses].map(([status, count]) => ({ status, orders: count })),
    dataQuality: { returnedOrders: orders.length, truncated: Boolean(orders.truncated) },
  };
}

async function report(shop, token, range) {
  const result = await getOrders(shop, token, range);
  const data = summarize(result.orders, range);
  data.dataQuality.truncated = result.truncated;
  return data;
}

function csvCell(value) {
  const text = String(value == null ? '' : value);
  return `"${text.replace(/"/g, '""')}"`;
}

router.get('/report', withShop(async (req, res, { shop, token }) => {
  const range = dateRange(req.query);
  res.json({ ok: true, report: await report(shop, token, range) });
}));

router.get('/export.csv', withShop(async (req, res, { shop, token }) => {
  const range = dateRange(req.query);
  const data = await report(shop, token, range);
  const lines = [
    ['type', 'date', 'orders', 'net_subtotal', 'currency', 'status'].map(csvCell).join(','),
    ...data.daily.map((d) => ['daily', d.date, d.orders, d.sales, data.summary.currency, ''].map(csvCell).join(',')),
    ...data.financialStatuses.map((s) => ['financial_status', '', s.orders, '', data.summary.currency, s.status].map(csvCell).join(',')),
  ];
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="aura-orders-${range.start}-to-${range.end}.csv"`);
  res.send(lines.join('\r\n'));
}));

module.exports = router;
