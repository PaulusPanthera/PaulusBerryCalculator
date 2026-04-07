// assets/js/modules/leppa/logic.js
// v2.0.0-beta
// Native Leppa route calculations using shared Shop prices, support-berry seed math, and fixed Harvest Tool cost.
import { BERRIES } from "../catalog/data.js";
import { FLAVOR_META } from "../pricing/defaults.js";
import {
  getBerryPrice,
  getHarvestToolPrice,
  getPriceState,
  getSeedPrice,
} from "../pricing/store.js";
import {
  DEFAULT_LEPPA_CHARACTERS,
  LEPPA_BASELINE_CHARACTERS,
  LEPPA_ROUTE_DEFINITIONS,
  LEPPA_SUPPORT_STEP,
  SUPPORT_BERRY_META,
} from "./data.js";

const LEPPA_BERRY = BERRIES.find((berry) => berry.slug === "leppa") ?? null;
const PLOTS_PER_CHARACTER = 156;
const BASELINE_LEPPA_YIELD = LEPPA_BERRY?.yieldPerPlot ?? 6;
const SEED_KEYS = [
  { flavor: "spicy", type: "plain" },
  { flavor: "spicy", type: "very" },
  { flavor: "bitter", type: "plain" },
  { flavor: "bitter", type: "very" },
  { flavor: "sweet", type: "plain" },
  { flavor: "sweet", type: "very" },
];

function clampNumber(value, fallback, min, max) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getScale(characters) {
  return clampNumber(characters, DEFAULT_LEPPA_CHARACTERS, 1, 99) / LEPPA_BASELINE_CHARACTERS;
}

function createEmptySeedMap() {
  const output = {};

  for (const entry of SEED_KEYS) {
    output[`${entry.flavor}:${entry.type}`] = 0;
  }

  return output;
}

function getSeedKey(flavor, type) {
  return `${flavor}:${type}`;
}

function getSeedLabel(flavor, type) {
  const meta = FLAVOR_META[flavor];
  const prefix = type === "very" ? "Very" : "Plain";

  return `${prefix} ${meta?.label || flavor}`;
}

function getSupportNetSeeds(slug, characters) {
  const meta = SUPPORT_BERRY_META[slug];
  const plots = characters * PLOTS_PER_CHARACTER;
  const berryCount = plots * meta.yieldPerPlot;
  const seedNet = createEmptySeedMap();

  for (const [flavor, values] of Object.entries(meta.netSeedOutput)) {
    seedNet[getSeedKey(flavor, "plain")] += plots * values.plain;
    seedNet[getSeedKey(flavor, "very")] += plots * values.very;
  }

  return {
    slug,
    label: meta.label,
    toolKind: meta.toolKind,
    characters,
    plots,
    berryCount,
    harvestTools: berryCount,
    seedNet,
  };
}

function applySeedMap(target, source) {
  for (const [key, value] of Object.entries(source)) {
    target[key] += value;
  }
}

function getSupportDetails(supportMix) {
  return Object.entries(supportMix)
    .filter(([, characters]) => characters > 0.001)
    .map(([slug, characters]) => getSupportNetSeeds(slug, characters));
}

function getNetSeedBalances(leppaPlots, supportDetails) {
  const balances = createEmptySeedMap();

  for (const detail of supportDetails) {
    applySeedMap(balances, detail.seedNet);
  }

  balances[getSeedKey("spicy", "very")] -= leppaPlots;
  balances[getSeedKey("bitter", "plain")] -= leppaPlots;
  balances[getSeedKey("sweet", "plain")] -= leppaPlots;

  return balances;
}

function getSeedLineTone(type, kind) {
  if (type === "very") {
    return kind === "seedBuy" ? "negative" : "very";
  }

  return kind === "seedBuy" ? "negative" : "plain";
}

function buildSeedLines(balances, priceState) {
  const revenueLines = [];
  const costLines = [];
  let totalBuyValue = 0;
  let nonSpicyBuyValue = 0;
  let spicyBuyValue = 0;

  for (const { flavor, type } of SEED_KEYS) {
    const key = getSeedKey(flavor, type);
    const quantity = balances[key];

    if (quantity > 0.001) {
      revenueLines.push({
        kind: "seedSell",
        seed: { flavor, type },
        quantity,
        label: `${getSeedLabel(flavor, type)} sales`,
        tone: getSeedLineTone(type, "seedSell"),
      });
      continue;
    }

    if (quantity < -0.001) {
      const absolute = Math.abs(quantity);
      const value = absolute * getSeedPrice(priceState, flavor, type, "buy");

      totalBuyValue += value;

      if (flavor === "spicy" && type === "very") {
        spicyBuyValue += value;
      } else {
        nonSpicyBuyValue += value;
      }

      costLines.push({
        kind: "seedBuy",
        seed: { flavor, type },
        quantity: absolute,
        label: `${getSeedLabel(flavor, type)} buys`,
        tone: getSeedLineTone(type, "seedBuy"),
      });
    }
  }

  return { revenueLines, costLines, totalBuyValue, nonSpicyBuyValue, spicyBuyValue };
}

function getDailyLeppaCount(leppaCharacters) {
  return leppaCharacters * PLOTS_PER_CHARACTER * BASELINE_LEPPA_YIELD;
}

function roundCharacters(value) {
  return Math.round(value * 100) / 100;
}

function compareScore(left, right) {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;

    if (leftValue < rightValue) {
      return -1;
    }

    if (leftValue > rightValue) {
      return 1;
    }
  }

  return 0;
}

function getScore(result, objective) {
  if (objective === "cash") {
    return [-result.dailyValue, result.totalBuyValue];
  }

  if (objective === "spicy-only-cash") {
    return [-result.dailyValue, result.spicyBuyValue];
  }

  return [result.totalBuyValue, -result.dailyValue];
}

function getSupportSummary(supportDetails) {
  if (!supportDetails.length) {
    return "No support berries";
  }

  return supportDetails
    .map((detail) => `${detail.label} ${roundCharacters(detail.characters)}c`)
    .join(" · ");
}

function buildRouteResult(definition, priceState, supportMix = {}) {
  const leppaCharacters = definition.baseLeppaCharacters;
  const leppaPlots = leppaCharacters * PLOTS_PER_CHARACTER;
  const supportDetails = getSupportDetails(supportMix);
  const balances = getNetSeedBalances(leppaPlots, supportDetails);
  const leppaSellPrice = getBerryPrice(priceState, LEPPA_BERRY, "sell");
  const leppaQuantity = getDailyLeppaCount(leppaCharacters);
  const leppaRevenueLine = {
    kind: "berrySell",
    berry: "leppa",
    quantity: leppaQuantity,
    label: "Leppa sales",
    tone: "plain",
  };
  const {
    revenueLines: seedRevenueLines,
    costLines: seedCostLines,
    totalBuyValue,
    nonSpicyBuyValue,
    spicyBuyValue,
  } = buildSeedLines(balances, priceState);
  const supportBerryCount = supportDetails.reduce((sum, detail) => sum + detail.berryCount, 0);
  const harvestToolQuantity = supportBerryCount;
  const toolLine =
    harvestToolQuantity > 0.001
      ? {
          kind: "tool",
          quantity: harvestToolQuantity,
          label: "Harvest Tools",
          tone: "negative",
        }
      : null;

  const revenueLines = [leppaRevenueLine, ...seedRevenueLines];
  const costLines = toolLine ? [...seedCostLines, toolLine] : [...seedCostLines];
  const leppaSellValue = leppaQuantity * leppaSellPrice;
  const soldSeedValue = seedRevenueLines.reduce(
    (sum, line) =>
      sum + line.quantity * getSeedPrice(priceState, line.seed.flavor, line.seed.type, "sell"),
    0,
  );
  const toolCost = harvestToolQuantity * getHarvestToolPrice();
  const totalCost = totalBuyValue + toolCost;
  const totalRevenue = leppaSellValue + soldSeedValue;
  const dailyValue = totalRevenue - totalCost;

  return {
    ...definition,
    baseDays: 1,
    effectiveDays: 1,
    leppaCharacters,
    supportCharacters: supportDetails.reduce((sum, detail) => sum + detail.characters, 0),
    supportDetails,
    supportSummary: getSupportSummary(supportDetails),
    supportBerryCount,
    leppaPlots,
    leppaQuantity,
    leppaSellPrice,
    netSeedBalances: balances,
    revenueLines,
    costLines,
    totalRevenue,
    totalCost,
    cycleValue: dailyValue,
    dailyValue,
    baseCycleValue: dailyValue,
    baseDailyValue: dailyValue,
    leppaOutput: { base: leppaQuantity, extra: 0, total: leppaQuantity },
    toolsUsed: harvestToolQuantity,
    boughtSeedValue: totalBuyValue,
    soldSeedValue,
    leppaSellValue,
    totalBuyValue,
    nonSpicyBuyValue,
    spicyBuyValue,
    buyPressure: totalBuyValue > 0.001,
    profitable: dailyValue > 0,
    hasSeedBuy: totalBuyValue > 0.001,
    hasExtraLeppa: false,
    routeKey: definition.id,
    buyProfile:
      totalBuyValue <= 0.001 ? "Buy-free" : nonSpicyBuyValue <= 0.001 ? "VS only" : "Mixed buys",
  };
}

function optimizeSupportMix(definition, priceState) {
  const totalUnits = Math.round(
    (LEPPA_BASELINE_CHARACTERS - definition.baseLeppaCharacters) / LEPPA_SUPPORT_STEP,
  );
  const supportPool = definition.supportPool ?? [];
  const minimumSupport = definition.minimumSupport ?? {};
  const minimumUnits = Object.fromEntries(
    supportPool.map((slug) => [slug, Math.round((minimumSupport[slug] || 0) / LEPPA_SUPPORT_STEP)]),
  );
  const lockedUnits = Object.values(minimumUnits).reduce((sum, value) => sum + value, 0);
  const freeUnits = totalUnits - lockedUnits;

  if (freeUnits < 0) {
    return buildRouteResult(definition, priceState, {});
  }

  let best = null;

  function search(index, remainingUnits, currentUnits) {
    if (index === supportPool.length) {
      if (remainingUnits !== 0) {
        return;
      }

      const supportMix = Object.fromEntries(
        supportPool.map((slug) => [slug, (currentUnits[slug] || 0) * LEPPA_SUPPORT_STEP]),
      );
      const result = buildRouteResult(definition, priceState, supportMix);

      if (definition.objective === "spicy-only-cash" && result.nonSpicyBuyValue > 0.001) {
        return;
      }

      const score = getScore(result, definition.objective);

      if (!best || compareScore(score, best.score) < 0) {
        best = { score, route: result };
      }

      return;
    }

    const slug = supportPool[index];
    const minimum = minimumUnits[slug] || 0;

    for (let units = 0; units <= remainingUnits; units += 1) {
      currentUnits[slug] = minimum + units;
      search(index + 1, remainingUnits - units, currentUnits);
    }
  }

  search(0, freeUnits, {});

  return best?.route ?? buildRouteResult(definition, priceState, {});
}

function buildBaselineRoute(definition, priceState) {
  if (definition.strategy === "fixed-gtl") {
    const leppaCharacters = definition.baseLeppaCharacters;
    const leppaPlots = leppaCharacters * PLOTS_PER_CHARACTER;
    const leppaQuantity = getDailyLeppaCount(leppaCharacters);
    const leppaSellPrice = getBerryPrice(priceState, LEPPA_BERRY, "sell");
    const revenueLines = [
      {
        kind: "berrySell",
        berry: "leppa",
        quantity: leppaQuantity,
        label: "Leppa sales",
        tone: "plain",
      },
    ];
    const costLines = [
      {
        kind: "seedBuy",
        seed: { flavor: "spicy", type: "very" },
        quantity: leppaPlots,
        label: "Very Spicy buys",
        tone: "negative",
      },
      {
        kind: "seedBuy",
        seed: { flavor: "bitter", type: "plain" },
        quantity: leppaPlots,
        label: "Plain Bitter buys",
        tone: "negative",
      },
      {
        kind: "seedBuy",
        seed: { flavor: "sweet", type: "plain" },
        quantity: leppaPlots,
        label: "Plain Sweet buys",
        tone: "negative",
      },
    ];
    const soldSeedValue = 0;
    const boughtSeedValue =
      leppaPlots * getSeedPrice(priceState, "spicy", "very", "buy") +
      leppaPlots * getSeedPrice(priceState, "bitter", "plain", "buy") +
      leppaPlots * getSeedPrice(priceState, "sweet", "plain", "buy");
    const leppaSellValue = leppaQuantity * leppaSellPrice;
    const totalRevenue = leppaSellValue;
    const totalCost = boughtSeedValue;
    const dailyValue = totalRevenue - totalCost;

    return {
      ...definition,
      baseDays: 1,
      effectiveDays: 1,
      leppaCharacters,
      supportCharacters: 0,
      supportDetails: [],
      supportSummary: "No support berries",
      supportBerryCount: 0,
      leppaPlots,
      leppaQuantity,
      leppaSellPrice,
      netSeedBalances: createEmptySeedMap(),
      revenueLines,
      costLines,
      totalRevenue,
      totalCost,
      cycleValue: dailyValue,
      dailyValue,
      baseCycleValue: dailyValue,
      baseDailyValue: dailyValue,
      leppaOutput: { base: leppaQuantity, extra: 0, total: leppaQuantity },
      toolsUsed: 0,
      boughtSeedValue,
      soldSeedValue,
      leppaSellValue,
      totalBuyValue: boughtSeedValue,
      nonSpicyBuyValue:
        leppaPlots * getSeedPrice(priceState, "bitter", "plain", "buy") +
        leppaPlots * getSeedPrice(priceState, "sweet", "plain", "buy"),
      spicyBuyValue: leppaPlots * getSeedPrice(priceState, "spicy", "very", "buy"),
      buyPressure: boughtSeedValue > 0.001,
      profitable: dailyValue > 0,
      hasSeedBuy: true,
      hasExtraLeppa: false,
      routeKey: definition.id,
      buyProfile: "Mixed buys",
    };
  }

  return optimizeSupportMix(definition, priceState);
}

function scaleLine(line, priceState, scale) {
  const quantity = line.quantity * scale;

  if (line.kind === "berrySell") {
    const unitPrice = getBerryPrice(priceState, LEPPA_BERRY, "sell");

    return {
      ...line,
      scaledQuantity: quantity,
      unitPrice,
      value: quantity * unitPrice,
      type: "revenue",
      tone: line.tone || "plain",
    };
  }

  if (line.kind === "seedSell") {
    const unitPrice = getSeedPrice(priceState, line.seed.flavor, line.seed.type, "sell");

    return {
      ...line,
      scaledQuantity: quantity,
      unitPrice,
      value: quantity * unitPrice,
      type: "revenue",
      tone: line.tone || getSeedLineTone(line.seed.type, "seedSell"),
    };
  }

  if (line.kind === "seedBuy") {
    const unitPrice = getSeedPrice(priceState, line.seed.flavor, line.seed.type, "buy");

    return {
      ...line,
      scaledQuantity: quantity,
      unitPrice,
      value: quantity * unitPrice,
      type: "cost",
      tone: line.tone || getSeedLineTone(line.seed.type, "seedBuy"),
    };
  }

  const unitPrice = getHarvestToolPrice();

  return {
    ...line,
    scaledQuantity: quantity,
    unitPrice,
    value: quantity * unitPrice,
    type: "cost",
    tone: line.tone || "negative",
  };
}

function scaleSupportDetails(details, scale) {
  return details.map((detail) => ({
    ...detail,
    characters: detail.characters * scale,
    plots: detail.plots * scale,
    berryCount: detail.berryCount * scale,
    harvestTools: detail.harvestTools * scale,
  }));
}

function scaleSeedBalances(balances, scale) {
  return Object.fromEntries(Object.entries(balances).map(([key, value]) => [key, value * scale]));
}

function sumLineValues(lines) {
  return lines.reduce((sum, line) => sum + line.value, 0);
}

function buildRoute(definition, priceState, characters) {
  const baseline = buildBaselineRoute(definition, priceState);
  const scale = getScale(characters);
  const revenueLines = baseline.revenueLines.map((line) => scaleLine(line, priceState, scale));
  const costLines = baseline.costLines.map((line) => scaleLine(line, priceState, scale));
  const supportDetails = scaleSupportDetails(baseline.supportDetails, scale);
  const totalRevenue = sumLineValues(revenueLines);
  const totalCost = sumLineValues(costLines);
  const cycleValue = totalRevenue - totalCost;
  const dailyValue = cycleValue;
  const leppaOutput = {
    base: baseline.leppaOutput.base * scale,
    extra: baseline.leppaOutput.extra * scale,
    total: baseline.leppaOutput.total * scale,
  };

  return {
    ...baseline,
    characters: clampNumber(characters, DEFAULT_LEPPA_CHARACTERS, 1, 99),
    scale,
    leppaCharacters: baseline.leppaCharacters * scale,
    supportCharacters: baseline.supportCharacters * scale,
    supportDetails,
    supportBerryCount: baseline.supportBerryCount * scale,
    leppaPlots: baseline.leppaPlots * scale,
    leppaQuantity: baseline.leppaQuantity * scale,
    netSeedBalances: scaleSeedBalances(baseline.netSeedBalances, scale),
    revenueLines,
    costLines,
    totalRevenue,
    totalCost,
    cycleValue,
    dailyValue,
    baseCycleValue: cycleValue,
    baseDailyValue: dailyValue,
    leppaOutput,
    toolsUsed: baseline.toolsUsed * scale,
    boughtSeedValue: sumLineValues(costLines.filter((line) => line.kind === "seedBuy")),
    soldSeedValue: sumLineValues(revenueLines.filter((line) => line.kind === "seedSell")),
    leppaSellValue: sumLineValues(revenueLines.filter((line) => line.kind === "berrySell")),
    totalBuyValue: sumLineValues(costLines.filter((line) => line.kind === "seedBuy")),
    nonSpicyBuyValue: sumLineValues(
      costLines.filter(
        (line) =>
          line.kind === "seedBuy" && !(line.seed.flavor === "spicy" && line.seed.type === "very"),
      ),
    ),
    spicyBuyValue: sumLineValues(
      costLines.filter(
        (line) =>
          line.kind === "seedBuy" && line.seed.flavor === "spicy" && line.seed.type === "very",
      ),
    ),
    buyPressure: sumLineValues(costLines.filter((line) => line.kind === "seedBuy")) > 0.001,
    profitable: dailyValue > 0,
    hasSeedBuy: sumLineValues(costLines.filter((line) => line.kind === "seedBuy")) > 0.001,
    routeKey: definition.id,
  };
}

function matchesRoute(route, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    route.label,
    route.shortLabel,
    route.familyLabel,
    route.summary,
    route.assumptionNote,
    route.supportSummary,
    route.buyProfile,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function sortRoutes(routes, sort) {
  const copy = [...routes];

  copy.sort((left, right) => {
    switch (sort) {
      case "cycle-desc":
        return right.cycleValue - left.cycleValue;
      case "leppa-desc":
        return right.leppaOutput.total - left.leppaOutput.total;
      case "name-asc":
        return left.label.localeCompare(right.label);
      case "daily-desc":
      default:
        return right.dailyValue - left.dailyValue;
    }
  });

  return copy;
}

export function getLeppaScenario(state) {
  const characters = clampNumber(state.characters, DEFAULT_LEPPA_CHARACTERS, 1, 99);
  const priceState = getPriceState();
  const routes = LEPPA_ROUTE_DEFINITIONS.map((definition) =>
    buildRoute(definition, priceState, characters),
  );
  const query = normalizeText(state.search);

  let visibleRoutes = routes.filter((route) => matchesRoute(route, query));

  if (state.visibility === "profitable") {
    visibleRoutes = visibleRoutes.filter((route) => route.profitable);
  }

  if (state.family !== "all") {
    visibleRoutes = visibleRoutes.filter((route) => route.family === state.family);
  }

  visibleRoutes = sortRoutes(visibleRoutes, state.sort);

  const bestRoute =
    [...routes].sort((left, right) => right.dailyValue - left.dailyValue)[0] ?? null;
  const lowestBuyRoute =
    [...routes].sort(
      (left, right) =>
        left.totalBuyValue - right.totalBuyValue || right.dailyValue - left.dailyValue,
    )[0] ?? null;

  return {
    characters,
    priceState,
    routes,
    visibleRoutes,
    totalCount: routes.length,
    profitableCount: routes.filter((route) => route.profitable).length,
    bestRoute,
    lowestBuyRoute,
    leppaBerry: LEPPA_BERRY,
  };
}
