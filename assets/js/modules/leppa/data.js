// assets/js/modules/leppa/data.js
// v2.0.0-beta
// Native Leppa planner route definitions and support-berry seed farming metadata.

export const LEPPA_BASELINE_CHARACTERS = 9;
export const DEFAULT_LEPPA_CHARACTERS = 9;
export const LEPPA_SUPPORT_STEP = 0.25;

export const SUPPORT_BERRY_META = {
  cheri: {
    slug: "cheri",
    label: "Cheri",
    yieldPerPlot: 4.5,
    toolKind: "1-day",
    netSeedOutput: {
      spicy: { plain: 2.15, very: 0.35 },
      bitter: { plain: 0, very: 0 },
      sweet: { plain: 0, very: 0 },
    },
  },
  rawst: {
    slug: "rawst",
    label: "Rawst",
    yieldPerPlot: 4.5,
    toolKind: "1-day",
    netSeedOutput: {
      spicy: { plain: 0, very: 0 },
      bitter: { plain: 2.15, very: 0.35 },
      sweet: { plain: 0, very: 0 },
    },
  },
  pecha: {
    slug: "pecha",
    label: "Pecha",
    yieldPerPlot: 4.5,
    toolKind: "1-day",
    netSeedOutput: {
      spicy: { plain: 0, very: 0 },
      bitter: { plain: 0, very: 0 },
      sweet: { plain: 2.15, very: 0.35 },
    },
  },
  aguav: {
    slug: "aguav",
    label: "Aguav",
    yieldPerPlot: 5.5,
    toolKind: "20h",
    netSeedOutput: {
      spicy: { plain: 0, very: 0 },
      bitter: { plain: 3.85, very: -0.35 },
      sweet: { plain: 0, very: 0 },
    },
  },
  mago: {
    slug: "mago",
    label: "Mago",
    yieldPerPlot: 5.5,
    toolKind: "20h",
    netSeedOutput: {
      spicy: { plain: 0, very: 0 },
      bitter: { plain: 0, very: 0 },
      sweet: { plain: 3.85, very: -0.35 },
    },
  },
};

export const LEPPA_ROUTE_DEFINITIONS = [
  {
    id: "gtl-buy-everything",
    label: "GTL buy-everything",
    shortLabel: "GTL",
    family: "gtl",
    familyLabel: "Buy-all benchmark",
    baseLeppaCharacters: 9,
    strategy: "fixed-gtl",
    summary:
      "Pure benchmark: buy every Leppa input seed, plant Leppas on all character slots, and sell the berries.",
    assumptionNote:
      "No seed farming here. This route is intentionally the clean buy-all benchmark for the Leppa page.",
  },
  {
    id: "standard-low-buy",
    label: "Standard support · low buy",
    shortLabel: "Standard",
    family: "standard",
    familyLabel: "Standard support",
    baseLeppaCharacters: 3,
    strategy: "optimized-support",
    supportPool: ["cheri", "rawst", "pecha"],
    minimumSupport: { cheri: 0.25, rawst: 0.25, pecha: 0.25 },
    objective: "low-buy",
    summary:
      "Old standard Leppa support pattern, recalculated natively from the current 30 / 70 seed split and fixed Harvest Tool cost.",
    assumptionNote:
      "Support berry slots are optimized in quarter-character steps to keep buy pressure as low as possible first, then improve daily value.",
  },
  {
    id: "standard-seed-cash",
    label: "Standard support · seed cash",
    shortLabel: "Standard+",
    family: "standard",
    familyLabel: "Standard support",
    baseLeppaCharacters: 3,
    strategy: "optimized-support",
    supportPool: ["cheri", "rawst", "pecha"],
    minimumSupport: { cheri: 0.25, rawst: 0.25, pecha: 0.25 },
    objective: "cash",
    summary:
      "Same standard support berry family, but biased toward stronger daily seed cashflow instead of lowest possible buy pressure.",
    assumptionNote:
      "This is still a Leppa route, but the remaining support slots are free to chase daily value once the basic standard pattern is present.",
  },
  {
    id: "alt-low-buy",
    label: "Alt support · low buy",
    shortLabel: "Alt HG",
    family: "alt",
    familyLabel: "Alt support",
    baseLeppaCharacters: 3.75,
    strategy: "optimized-support",
    supportPool: ["cheri", "rawst", "pecha", "aguav", "mago"],
    minimumSupport: { cheri: 0.25, rawst: 0.25, pecha: 0.25, aguav: 0.25, mago: 0.25 },
    objective: "low-buy",
    summary:
      "Adds Aguav and Mago into the support toolbox, but still prioritizes a lower-buy daily Leppa pattern over raw seed cash.",
    assumptionNote:
      "Aguav and Mago are allowed, but the route is still scored by total buy pressure first. Under current rules this is not always fully self-sustaining.",
  },
  {
    id: "upgraded-seed-cash",
    label: "Upgraded support · seed cash",
    shortLabel: "Upgraded",
    family: "alt",
    familyLabel: "Alt support",
    baseLeppaCharacters: 4,
    strategy: "optimized-support",
    supportPool: ["cheri", "rawst", "pecha", "aguav", "mago"],
    minimumSupport: { cheri: 0.25, rawst: 0.25, pecha: 0.25, aguav: 0.25, mago: 0.25 },
    objective: "cash",
    summary:
      "More aggressive Leppa load with the full support toolbox unlocked. Useful for checking whether the extra complexity actually pays.",
    assumptionNote:
      "This native version scores for daily value after the base support pattern is present. It does not assume the sheet’s old long-cycle carryover math.",
  },
  {
    id: "hybrid-gtl-spicy",
    label: "Hybrid GTL · spicy buy",
    shortLabel: "HG + GTL",
    family: "hybrid",
    familyLabel: "Hybrid buy",
    baseLeppaCharacters: 4.25,
    strategy: "optimized-support",
    supportPool: ["cheri", "rawst", "pecha", "aguav", "mago"],
    minimumSupport: { rawst: 0.25, pecha: 0.25, aguav: 0.25, mago: 0.25 },
    objective: "spicy-only-cash",
    summary:
      "Leans into buying only the spicy pressure while the support side covers the bitter and sweet requirements as efficiently as possible.",
    assumptionNote:
      "Non-spicy deficits are disallowed here. The optimizer can only leave Very Spicy buy pressure and will chase daily value within that rule.",
  },
];
