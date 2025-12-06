// src/tools/review-ugc-engine/index.js
// ===============================================
// AURA • Review & UGC Engine  (dummy implementation)
// - Generates example reviews / UGC captions
// - No OpenAI required
// ===============================================

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function titleCase(str = "") {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function buildReviewText({ storeName, productName, tone }) {
  const intros = {
    default: [
      `Absolutely obsessed with this ${productName}!`,
      `Wasn’t sure at first, but this ${productName} blew me away.`,
      `This might be my favourite ${productName} yet.`,
      `So impressed with the quality of this ${productName}.`,
    ],
    friendly: [
      `Okay so… this ${productName} is unreal.`,
      `Low-key can’t stop wearing this ${productName}.`,
      `Had to leave a review because this ${productName} is THAT good.`,
    ],
    social: [
      `PSA: you need this ${productName} in your life.`,
      `Adding this ${productName} to my everyday rotation.`,
      `Can’t gatekeep this ${productName} anymore.`,
    ],
    luxe: [
      `This ${productName} feels so premium and well made.`,
      `Everything about this ${productName} feels elevated.`,
      `The finish on this ${productName} looks super high-end in real life.`,
    ],
  };

  const bodies = [
    `I’ve worn it constantly and it still looks brand new. No fading, no irritation – just perfect.`,
    `Super comfortable to wear all day and it goes with literally everything in my wardrobe.`,
    `I’ve already had so many compliments – a few friends have ordered the same one.`,
    `Delivery was quick and the packaging from ${storeName} felt really special.`,
    `Feels way more expensive than it actually is – definitely worth the price.`,
  ];

  const outros = [
    `If you’re thinking about it, just go for it.`,
    `Would 100% buy from ${storeName} again.`,
    `Already eyeing up my next piece from ${storeName}.`,
    `Highly recommend if you’ve been looking for something like this.`,
  ];

  const toneKey =
    tone && tone.toLowerCase().includes("social")
      ? "social"
      : tone && tone.toLowerCase().includes("friendly")
      ? "friendly"
      : tone && tone.toLowerCase().includes("lux")
      ? "luxe"
      : "default";

  const intro = pick(intros[toneKey] || intros.default);
  const body = pick(bodies);
  const outro = pick(outros);

  return `${intro} ${body} ${outro}`;
}

function randomName() {
  const first = ["Sophie", "Amelia", "Chloe", "Ava", "Ella", "Mia", "Isla", "Grace", "Olivia", "Freya"];
  const lastInitial = ["P", "D", "L", "M", "H", "K", "J", "R", "T", "B"];
  return `${pick(first)} ${pick(lastInitial)}.`;
}

function buildReviews(input) {
  const storeName = titleCase(input.store_name || "Your Store");
  const productName = input.product_name || "your product";
  const tone = input.tone || "friendly, social, UGC";
  const platform = (input.platform || "shopify").toLowerCase();
  const numReviews = Math.max(1, Math.min(Number(input.num_reviews || 3), 10));

  const baseRating = 4.8;
  const reviews = [];

  for (let i = 0; i < numReviews; i++) {
    const ratingJitter = i === 0 ? 0 : Math.random() * 0.4 - 0.2; // tiny variation
    const rating = Math.max(4, Math.min(5, baseRating + ratingJitter));

    reviews.push({
      id: `${Date.now()}-${i}`,
      platform,
      store_name: storeName,
      product_name: productName,
      rating: Number(rating.toFixed(1)),
      customer_name: randomName(),
      review_text: buildReviewText({ storeName, productName, tone }),
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      verified_purchase: true,
      language: input.lang || "en-GB",
    });
  }

  return reviews;
}

module.exports = {
  key: "review-ugc-engine",
  name: "AURA • Review & UGC Engine",

  /**
   * run(input, ctx)
   * input: {
   *   store_name,
   *   product_name,
   *   platform,
   *   tone,
   *   lang,
   *   num_reviews
   * }
   */
  async run(input = {}, ctx = {}) {
    const reviews = buildReviews(input);

    return {
      ok: true,
      engine: "review-ugc-engine",
      count: reviews.length,
      platform: (input.platform || "shopify").toLowerCase(),
      reviews,
      raw_input: input,
    };
  },
};
