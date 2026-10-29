// ─────────────────────────────────────────────────────────────
// STORE SETTINGS — edit these, everything else updates itself.
// ─────────────────────────────────────────────────────────────

export const STORE = {
  name: "Moderna",
  tagline: "Women's premium leather shoes, made in Lebanon.",

  // WhatsApp number that receives orders. Country code, no + or spaces.
  // Example Lebanon mobile: "9613123456"
  whatsappNumber: "9613684661",

  // Optional Instagram handle shown in footer / nav
  instagramHandle: "moderna_lebanon",

  currency: "$",

  // Shown on empty cart / about sections
  about:
    "Moderna designs and hand-finishes premium leather shoes for women, crafted in Lebanon with an eye for quiet, lasting style.",
};

// Most pairs of one size/color a single order can hold. Matches the limit in
// Stockroom's take_stock function, which refuses more than 10 per line.
export const MAX_QTY_PER_ITEM = 10;

export const CATEGORIES = [
  "Heels",
  "Flats",
  "Sandals",
  "Boots",
  "Sneakers",
  "Bags",
];
