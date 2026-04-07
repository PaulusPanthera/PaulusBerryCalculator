// assets/js/modules/pricing/defaults.js
// v2.0.0-beta
// Shared default prices, flavor metadata, and auto-price placeholders for Shop and all route tabs.

export const FLAVOR_ORDER = ["spicy", "bitter", "sweet", "dry", "sour"];

export const FLAVOR_META = {
  spicy: {
    label: "Spicy",
    plainLabel: "Plain Spicy",
    veryLabel: "Very Spicy",
    plainIcon: "../assets/img/seeds/plain-spicy.png",
    veryIcon: "../assets/img/seeds/very-spicy.png",
  },
  bitter: {
    label: "Bitter",
    plainLabel: "Plain Bitter",
    veryLabel: "Very Bitter",
    plainIcon: "../assets/img/seeds/plain-bitter.png",
    veryIcon: "../assets/img/seeds/very-bitter.png",
  },
  sweet: {
    label: "Sweet",
    plainLabel: "Plain Sweet",
    veryLabel: "Very Sweet",
    plainIcon: "../assets/img/seeds/plain-sweet.png",
    veryIcon: "../assets/img/seeds/very-sweet.png",
  },
  dry: {
    label: "Dry",
    plainLabel: "Plain Dry",
    veryLabel: "Very Dry",
    plainIcon: "../assets/img/seeds/plain-dry.png",
    veryIcon: "../assets/img/seeds/very-dry.png",
  },
  sour: {
    label: "Sour",
    plainLabel: "Plain Sour",
    veryLabel: "Very Sour",
    plainIcon: "../assets/img/seeds/plain-sour.png",
    veryIcon: "../assets/img/seeds/very-sour.png",
  },
};

export const AUTO_SOURCE_PRESETS = {
  fiereu: {
    label: "Fiereu mirror",
    endpoint: "https://apis.fiereu.de/pokemmoprices/v1/items",
  },
  custom: {
    label: "Custom endpoint",
    endpoint: "",
  },
};

function powderTargetDefaults() {
  return {
    ppMax: 19000,
    maxRevive: 7000,
    maxPotion: 2600,
    fullRestore: 3500,
    fullHeal: 1750,
    maxElixir: 24000,
    maxEther: 12000,
    hyperHpUp: 3000,
    hyperProtein: 7400,
    hyperIron: 2300,
    hyperCalcium: 6300,
    hyperZinc: 2500,
    hyperCarbos: 13500,
    hpUp: 2000,
    protein: 2000,
    iron: 2000,
    calcium: 2000,
    zinc: 2000,
    carbos: 3100,
  };
}

function powderIngredientDefaults() {
  return {
    whiteHerb: 1100,
    revivalHerb: 2900,
    energyRoot: 2700,
    evWing: 800,
  };
}

function seedPairDefaults(plain, very) {
  return {
    plain: { sell: plain, buy: plain },
    very: { sell: very, buy: very },
  };
}

function emptySeedPairDefaults() {
  return {
    plain: { sell: 0, buy: 0 },
    very: { sell: 0, buy: 0 },
  };
}

function autoSeedDefaults() {
  return {
    spicy: emptySeedPairDefaults(),
    bitter: emptySeedPairDefaults(),
    sweet: emptySeedPairDefaults(),
    dry: emptySeedPairDefaults(),
    sour: emptySeedPairDefaults(),
  };
}

export const DEFAULT_PRICE_STATE = {
  seeds: {
    mode: "manual",
    manual: {
      spicy: seedPairDefaults(790, 1800),
      bitter: seedPairDefaults(900, 1730),
      sweet: seedPairDefaults(870, 1720),
      dry: seedPairDefaults(720, 1780),
      sour: seedPairDefaults(810, 1770),
    },
    auto: autoSeedDefaults(),
  },
  berries: {
    mode: "vendor",
    manual: {},
    auto: {},
  },
  tools: {
    mode: "vendor",
    harvestTool: {
      vendor: 350,
      manual: 350,
    },
  },
  powder: {
    targetMode: "manual",
    ingredientMode: "manual",
    berryMode: "vendor",
    targets: powderTargetDefaults(),
    ingredients: powderIngredientDefaults(),
    autoTargets: {},
    autoIngredients: {},
  },
  autoPricing: {
    source: "fiereu",
    customEndpoint: "",
    lastSyncAt: "",
    lastSyncSource: "",
    lastEndpoint: "",
    lastStatus: "idle",
    lastError: "",
    matchedSeeds: 0,
    matchedBerries: 0,
    matchedPowderTargets: 0,
    matchedPowderIngredients: 0,
  },
};
