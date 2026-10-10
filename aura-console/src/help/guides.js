// Written how-to guides for each live tool. Add a video link to `video` once the tutorial is recorded
// (a YouTube/Vimeo/Loom share URL); the Help page shows the video button only when one is set.
const GUIDES = {
  "product-seo": { steps: ["Open Product SEO and pick the products you want to improve.", "Press the AI button to draft a title and meta description. The credit cost shows before you confirm.", "Read the draft, edit it if you like, then apply it to the product.", "Use Bulk to do several products in one go."], video: "" },
  "blog-seo": { steps: ["Paste or open a blog post.", "Add your target keyword and run the check to see a score and fixes.", "Apply the suggestions you agree with and save."], video: "" },
  "image-alt-media-seo": { steps: ["Open Image Alt Text and let it scan your products.", "Images with missing or weak alt text are listed.", "Generate alt text with AI, check each one, then apply."], video: "" },
  "translations": { steps: ["Choose the language and the products to translate.", "Run the AI translation and review each result.", "Apply the ones you approve. Any change can be undone from the list."], video: "" },
  "product-feed": { steps: ["Open Product Feed to check every product against Google Shopping rules.", "Fix weak listings with AI, one at a time or in bulk.", "Export the feed file and upload it to Google Merchant Center."], video: "" },
  "size-guides": { steps: ["Create a guide: name it, say which products it matches, add columns and rows.", "Or use AI to draft a first table, then check the sizes yourself.", "Save and make sure it is switched on. It appears on matching product pages."], video: "" },
  "popups": { steps: ["Create a popup and choose its message, trigger and timing.", "Use AI for the wording if you want, then edit it.", "Switch it on. Sign-ups appear in the list, ready to export."], video: "" },
  "back-in-stock": { steps: ["Shoppers sign up on sold-out products.", "When an item is back, they are told once.", "Check the sign-up list and what has been sent from the tool page."], video: "" },
  "order-tracking": { steps: ["Open Order Tracking to see fulfilment and tracking for each order.", "Late orders are flagged.", "Use AI to draft a customer update, edit it, then send."], video: "" },
  "discounts-bundles": { steps: ["See offers suggested from what customers buy together.", "Create the discount code in Shopify from the tool.", "Pause or delete codes any time."], video: "" },
  "ab-testing-suite": { steps: ["Create an experiment and define the variants.", "Set how traffic is split and start the test.", "Read the results and pick the winner."], video: "" },
};

export default GUIDES;
