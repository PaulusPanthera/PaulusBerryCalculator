// assets/js/modules/pricing/auto.js
// v2.0.0-beta
// Auto-price source adapters, GTL listing-fee helpers, and item-name mapping for seeds and berries.
import { FLAVOR_META, FLAVOR_ORDER } from "./defaults.js";
import { BERRIES } from "../catalog/data.js";
import { POWDER_TARGETS } from "../powder/data.js";

const REQUEST_TIMEOUT_MS = 12000;

const SEED_ITEM_IDS = {
  spicy: {
    plain: 1030,
    very: 1031,
  },
  dry: {
    plain: 1032,
    very: 1033,
  },
  sweet: {
    plain: 1034,
    very: 1035,
  },
  bitter: {
    plain: 1036,
    very: 1037,
  },
  sour: {
    plain: 1038,
    very: 1039,
  },
};

const POWDER_TARGET_ITEM_IDS = {
  ppMax: [71, 9053],
  maxRevive: [25, 9029],
  maxPotion: [20, 9024],
  fullRestore: [19, 9023],
  fullHeal: [23, 9027],
  maxElixir: [37, 9041],
  maxEther: [35, 9039],
  hpUp: [63, 9045],
  protein: [64, 9046],
  iron: [65, 9047],
  calcium: [67, 9049],
  zinc: [70, 9052],
  carbos: [66, 9048],
  hyperHpUp: [],
  hyperProtein: [],
  hyperIron: [],
  hyperCalcium: [],
  hyperZinc: [],
  hyperCarbos: [],
};

const POWDER_INGREDIENT_ITEM_IDS = {
  whiteHerb: [180, 5214, 9214],
  revivalHerb: [33, 9037],
  energyRoot: [31, 9035],
  evWing: [5565, 5566, 5567, 5568, 5569, 5570, 6565, 6566, 6567, 6568, 6569, 6570],
};

const BERRY_ITEM_IDS = {
  aguav: 5162,
  apicot: 5205,
  aspear: 5153,
  babiri: 5199,
  belue: 5183,
  bluk: 5165,
  charti: 5195,
  cheri: 5149,
  chesto: 5150,
  chilan: 5200,
  chople: 5189,
  coba: 5192,
  colbur: 5198,
  cornn: 5175,
  custap: 5210,
  durin: 5182,
  enigma: 5208,
  figy: 5159,
  ganlon: 5202,
  grepa: 5173,
  haban: 5197,
  hondew: 5172,
  iapapa: 5163,
  jaboca: 5211,
  kasib: 5196,
  kebia: 5190,
  kelpsy: 5170,
  lansat: 5206,
  leppa: 5154,
  liechi: 5201,
  lum: 5157,
  mago: 5161,
  magost: 5176,
  micle: 5209,
  nanab: 5166,
  nomel: 5178,
  occa: 5184,
  oran: 5155,
  pamtre: 5180,
  passho: 5185,
  payapa: 5193,
  pecha: 5151,
  persim: 5156,
  petaya: 5204,
  pinap: 5168,
  pomeg: 5169,
  qualot: 5171,
  rabuta: 5177,
  rawst: 5152,
  razz: 5164,
  rindo: 5187,
  rowap: 5212,
  salac: 5203,
  shuca: 5191,
  sitrus: 5158,
  spelon: 5179,
  starf: 5207,
  tamato: 5174,
  tanga: 5194,
  wacan: 5186,
  watmel: 5181,
  wepear: 5167,
  wiki: 5160,
  yache: 5188,
};

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/berry/g, "berry")
    .replace(/seed/g, "seed")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function createSeedTarget(flavor, type) {
  const meta = FLAVOR_META[flavor];
  const typeLabel = type === "very" ? meta.veryLabel : meta.plainLabel;
  const label = `${typeLabel} Seed`;

  return {
    kind: "seed",
    flavor,
    type,
    label,
    itemIds: [SEED_ITEM_IDS[flavor]?.[type]].filter(Number.isInteger),
    aliases: [label, `${typeLabel}`, `${type} ${meta.label} seed`].map(normalizeKey),
  };
}

function createBerryTarget(berry) {
  return {
    kind: "berry",
    slug: berry.slug,
    label: berry.name,
    itemIds: [BERRY_ITEM_IDS[berry.slug]].filter(Number.isInteger),
    aliases: [berry.name, berry.shortName, `${berry.shortName} Berry`].map(normalizeKey),
  };
}

function splitCamelCase(value) {
  return String(value || "").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function createPowderTarget(target) {
  const aliases = new Set(
    [
      target.label,
      target.label.replace(/\s+/g, ""),
      target.priceKey,
      splitCamelCase(target.priceKey),
    ].map(normalizeKey),
  );

  return {
    kind: "powder-target",
    key: target.priceKey,
    label: target.label,
    itemIds: [...(POWDER_TARGET_ITEM_IDS[target.priceKey] ?? [])],
    aliases: [...aliases],
  };
}

function createPowderIngredientTarget(key, label, itemIds) {
  const aliases = new Set(
    [label, label.replace(/\s+/g, ""), key, splitCamelCase(key)].map(normalizeKey),
  );

  return {
    kind: "powder-ingredient",
    key,
    label,
    itemIds: [...itemIds],
    aliases: [...aliases],
  };
}

const TARGETS = [
  ...FLAVOR_ORDER.flatMap((flavor) => [
    createSeedTarget(flavor, "plain"),
    createSeedTarget(flavor, "very"),
  ]),
  ...BERRIES.map((berry) => createBerryTarget(berry)),
  ...POWDER_TARGETS.map((target) => createPowderTarget(target)),
  createPowderIngredientTarget("whiteHerb", "White Herb", POWDER_INGREDIENT_ITEM_IDS.whiteHerb),
  createPowderIngredientTarget(
    "revivalHerb",
    "Revival Herb",
    POWDER_INGREDIENT_ITEM_IDS.revivalHerb,
  ),
  createPowderIngredientTarget("energyRoot", "Energy Root", POWDER_INGREDIENT_ITEM_IDS.energyRoot),
  createPowderIngredientTarget("evWing", "EV Wing", POWDER_INGREDIENT_ITEM_IDS.evWing),
];

const ALIAS_TO_TARGET = TARGETS.reduce((map, target) => {
  for (const alias of target.aliases) {
    map.set(alias, target);
  }
  return map;
}, new Map());

const ITEM_ID_TO_TARGET = TARGETS.reduce((map, target) => {
  for (const itemId of target.itemIds || []) {
    if (Number.isInteger(itemId) && itemId > 0) {
      map.set(itemId, target);
    }
  }
  return map;
}, new Map());

function getItemsArray(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  return [];
}

function getItemId(entry) {
  const candidates = [entry?.item_id, entry?.itemId, entry?.id, entry?.item?.id];

  for (const candidate of candidates) {
    const numeric = Number(candidate);

    if (Number.isInteger(numeric) && numeric > 0) {
      return numeric;
    }
  }

  return 0;
}

function getItemName(entry) {
  return (
    [
      entry?.name,
      entry?.itemName,
      entry?.item_name,
      entry?.title,
      entry?.item?.name,
      entry?.market_name,
    ].find((value) => typeof value === "string" && value.trim().length > 0) || ""
  );
}

function getListedPrice(entry) {
  const candidates = [
    entry?.price,
    entry?.latestPrice,
    entry?.currentPrice,
    entry?.listedPrice,
    entry?.minPrice,
    entry?.lowestPrice,
    entry?.cheapestPrice,
    entry?.value,
    entry?.priceAmount,
    entry?.item?.price,
  ];

  for (const candidate of candidates) {
    const numeric = Number(candidate);

    if (Number.isFinite(numeric) && numeric > 0) {
      return Math.round(numeric);
    }
  }

  return 0;
}

export function getListingFee(listedPrice) {
  const price = Math.max(0, Math.round(Number(listedPrice) || 0));
  return Math.min(25000, Math.max(100, Math.floor(price * 0.05)));
}

export function getNetSellFromListedPrice(listedPrice) {
  const price = Math.max(0, Math.round(Number(listedPrice) || 0));
  if (price === 0) {
    return 0;
  }

  return Math.max(0, price - getListingFee(price));
}

function createEmptyAutoSnapshot() {
  const seeds = {};

  for (const flavor of FLAVOR_ORDER) {
    seeds[flavor] = {
      plain: { buy: 0, sell: 0 },
      very: { buy: 0, sell: 0 },
    };
  }

  return {
    seeds,
    berries: {},
    powderTargets: {},
    powderIngredients: {},
    matchedSeeds: 0,
    matchedBerries: 0,
    matchedPowderTargets: 0,
    matchedPowderIngredients: 0,
  };
}

function applyMatchedPrice(snapshot, target, listedPrice) {
  if (listedPrice <= 0) {
    return;
  }

  const pair = {
    buy: listedPrice,
    sell: getNetSellFromListedPrice(listedPrice),
  };

  if (target.kind === "seed") {
    snapshot.seeds[target.flavor][target.type] = pair;
    snapshot.matchedSeeds += 1;
    return;
  }

  if (target.kind === "berry") {
    snapshot.berries[target.slug] = pair;
    snapshot.matchedBerries += 1;
    return;
  }

  if (target.kind === "powder-target") {
    snapshot.powderTargets[target.key] = pair.sell;
    snapshot.matchedPowderTargets += 1;
    return;
  }

  snapshot.powderIngredients[target.key] = pair.buy;
  snapshot.matchedPowderIngredients += 1;
}

function getTargetKey(target) {
  if (target.kind === "seed") {
    return `${target.kind}:${target.flavor}:${target.type}`;
  }

  if (target.kind === "berry") {
    return `${target.kind}:${target.slug}`;
  }

  return `${target.kind}:${target.key}`;
}

function getPowderIngredientAggregationValue(targetKey, values) {
  if (!values.length) {
    return 0;
  }

  if (targetKey === "evWing") {
    const total = values.reduce((sum, value) => sum + value, 0);
    return Math.round(total / values.length);
  }

  return values[0];
}

function mapEntriesToSnapshot(entries) {
  const snapshot = createEmptyAutoSnapshot();
  const seen = new Set();
  const ingredientBuckets = new Map();

  for (const entry of entries) {
    const itemId = getItemId(entry);
    const rawName = getItemName(entry);
    const normalized = normalizeKey(rawName);
    const target = ITEM_ID_TO_TARGET.get(itemId) || ALIAS_TO_TARGET.get(normalized);

    if (!target) {
      continue;
    }

    const listedPrice = getListedPrice(entry);

    if (listedPrice <= 0) {
      continue;
    }

    if (target.kind === "powder-ingredient") {
      const bucket = ingredientBuckets.get(target.key) || [];
      bucket.push(listedPrice);
      ingredientBuckets.set(target.key, bucket);
      continue;
    }

    const targetKey = getTargetKey(target);

    if (seen.has(targetKey)) {
      continue;
    }

    applyMatchedPrice(snapshot, target, listedPrice);
    seen.add(targetKey);
  }

  for (const [targetKey, values] of ingredientBuckets.entries()) {
    const listedPrice = getPowderIngredientAggregationValue(targetKey, values);
    const target = TARGETS.find(
      (entry) => entry.kind === "powder-ingredient" && entry.key === targetKey,
    );

    if (target && listedPrice > 0) {
      applyMatchedPrice(snapshot, target, listedPrice);
    }
  }

  return snapshot;
}

export async function fetchAutoPrices(endpoint) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const items = getItemsArray(payload);

    if (!items.length) {
      throw new Error("No item rows found");
    }

    return mapEntriesToSnapshot(items);
  } finally {
    window.clearTimeout(timeoutId);
  }
}
