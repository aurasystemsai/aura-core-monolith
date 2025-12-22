// Shopify App Bridge setup for embedded app
import createApp from '@shopify/app-bridge';

export function getShopifyAppBridge(shopOrigin) {
  // You may want to get apiKey from env or config
  const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY || window.SHOPIFY_API_KEY || '';
  if (!apiKey || !shopOrigin) return null;
  return createApp({
    apiKey,
    shopOrigin,
    forceRedirect: true,
  });
}
