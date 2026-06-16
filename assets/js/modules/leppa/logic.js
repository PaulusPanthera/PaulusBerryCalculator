// assets/js/modules/leppa/logic.js
// v2.0.0-beta
// Clean Leppa route calculations for normalized buy and self-sufficient support systems.
import { BERRIES } from "../catalog/data.js";
import { FLAVOR_META, FLAVOR_ORDER } from "../pricing/defaults.js";
import {
  getBerryPrice,
  getHarvestToolPrice,
  getLeppaSeedPacketQuote,
  getPriceState,
  getSeedPrice,
} from "../pricing/store.js";
import { getRecipeMethods } from "../recipes/variants.js";
import { getHarvestOutputsByFlavor } from "../seed-harvest/logic.js";
import { getRhythmLabel, getScheduleDaysForGrowth } from "../settings/rhythm.js";
import { getStandardDaysForGrowth, parseSeedToken } from "../seeds/data.js";
import {
  DEFAULT_LEPPA_CHARACTERS,
  LEPPA_DEFAULT_VERY_RATE,
  LEPPA_PLOTS_PER_CHARACTER,
  LEPPA_ROUTE_DEFINITIONS,
} from "./data.js";

const LEPPA_BERRY = BERRIES.find((berry) => berry.slug === "leppa") ?? null;
const SEED_KEYS = FLAVOR_ORDER.flatMap((flavor) => [
  { flavor, type: "plain" },
  { flavor, type: "very" },
]);

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

function getSeedKey(flavor, type) {
  return `${flavor}:${type}`;
}

function createEmptySeedMap() {
  const output = {};

  for (const { flavor, type } of SEED_KEYS) {
    output[getSeedKey(flavor, type)] = 0;
  }

  return output;
}

function addSeedMap(target, source, scale = 1) {
  for (const [key, value] of Object.entries(source)) {
    target[key] += value * scale;
  }
}

function getSeedLabel(flavor, type) {
  const meta = FLAVOR_META[flavor];
  const prefix = type === "very" ? "Very" : "Plain";
  return `${prefix} ${meta?.label || flavor}`;
}

function getBerryBySlug(slug) {
  return BERRIES.find((berry) => berry.slug === slug) ?? null;
}

function getRecipeCounts(recipeTokens) {
  const counts = createEmptySeedMap();

  recipeTokens.forEach((token) => {
    counts[getSeedKey(token.flavor, token.type)] += 1;
  });

  return counts;
}

function getSupportMethod(berry, preferredKind = "exact") {
  const methods = getRecipeMethods(berry);

  if (preferredKind === "plain-swap") {
    return methods.find((method) => method.kind === "plain-swap") ?? methods[0];
  }

  return methods.find((method) => method.kind === "exact") ?? methods[0];
}

function getFullSupportHarvest(slug, preferredKind = "exact", rhythmMode = "normal") {
  const berry = getBerryBySlug(slug);
  const method = getSupportMethod(berry, preferredKind);
  const recipeTokens = method.recipe.map(parseSeedToken);
  const totalBerries = berry.yieldPerPlot * LEPPA_PLOTS_PER_CHARACTER;
  const { output } = getHarvestOutputsByFlavor(totalBerries, recipeTokens, LEPPA_DEFAULT_VERY_RATE);
  const recipeCounts = getRecipeCounts(recipeTokens);
  const netSeeds = createEmptySeedMap();

  for (const { flavor, type } of SEED_KEYS) {
    netSeeds[getSeedKey(flavor, type)] =
      output[flavor][type] - recipeCounts[getSeedKey(flavor, type)] * LEPPA_PLOTS_PER_CHARACTER;
  }

  return {
    slug,
    label: berry.shortName,
    method,
    standardDays: getStandardDaysForGrowth(berry.growthHours),
    scheduleDays: getScheduleDaysForGrowth(berry.growthHours, rhythmMode),
    berryCount: totalBerries,
    netSeeds,
  };
}

function getRequiredSupport(definition, rhythmMode) {
  const cheri = getFullSupportHarvest("cheri", "plain-swap", rhythmMode);
  const verySpicyPerCheri = cheri.netSeeds[getSeedKey("spicy", "very")];

  if (definition.supportSystem === "starf") {
    const starf = getFullSupportHarvest("starf", "exact", rhythmMode);
    const plainBitterPerStarf = starf.netSeeds[getSeedKey("bitter", "plain")];
    const plainSweetPerStarf = starf.netSeeds[getSeedKey("sweet", "plain")];
    const leppaPlantsPerStarf = Math.min(plainBitterPerStarf, plainSweetPerStarf);

    return {
      components: [
        { harvest: cheri, harvestsPerLeppaPlant: 1 / verySpicyPerCheri },
        { harvest: starf, harvestsPerLeppaPlant: 1 / leppaPlantsPerStarf },
      ],
    };
  }

  const rawst = getFullSupportHarvest("rawst", "exact", rhythmMode);
  const pecha = getFullSupportHarvest("pecha", "exact", rhythmMode);

  return {
    components: [
      { harvest: cheri, harvestsPerLeppaPlant: 1 / verySpicyPerCheri },
      {
        harvest: rawst,
        harvestsPerLeppaPlant: 1 / rawst.netSeeds[getSeedKey("bitter", "plain")],
      },
      {
        harvest: pecha,
        harvestsPerLeppaPlant: 1 / pecha.netSeeds[getSeedKey("sweet", "plain")],
      },
    ],
  };
}

function getLeppaStandardDays() {
  return getStandardDaysForGrowth(LEPPA_BERRY?.growthHours ?? 20);
}

function getLeppaSellPrice(priceState) {
  return LEPPA_BERRY ? getBerryPrice(priceState, LEPPA_BERRY, "sell") : 0;
}

function createLine({ kind, label, quantity, unitPrice, tone }) {
  return {
    kind,
    label,
    quantity,
    scaledQuantity: quantity,
    unitPrice,
    value: quantity * unitPrice,
    tone,
  };
}

function buildSeedBalanceLines(seedBalances, priceState) {
  const revenueLines = [];
  const costLines = [];
  let soldSeedValue = 0;
  let boughtSeedValue = 0;
  let totalBuyValue = 0;
  let buyPressure = false;

  for (const { flavor, type } of SEED_KEYS) {
    const quantity = seedBalances[getSeedKey(flavor, type)];

    if (quantity > 0.001) {
      const unitPrice = getSeedPrice(priceState, flavor, type, "sell");
      const value = quantity * unitPrice;
      soldSeedValue += value;
      revenueLines.push(
        createLine({
          kind: "seedSell",
          label: `${getSeedLabel(flavor, type)} surplus`,
          quantity,
          unitPrice,
          tone: type === "very" ? "very" : "plain",
        }),
      );
      continue;
    }

    if (quantity < -0.001) {
      const absolute = Math.abs(quantity);
      const unitPrice = getSeedPrice(priceState, flavor, type, "buy");
      const value = absolute * unitPrice;
      boughtSeedValue += value;
      totalBuyValue += value;
      buyPressure = true;
      costLines.push(
        createLine({
          kind: "seedBuy",
          label: `${getSeedLabel(flavor, type)} buys`,
          quantity: absolute,
          unitPrice,
          tone: "negative",
        }),
      );
    }
  }

  return { revenueLines, costLines, soldSeedValue, boughtSeedValue, totalBuyValue, buyPressure };
}

function buildBuyRoute(definition, priceState, characters, rhythmMode) {
  const leppaScheduleDays = getScheduleDaysForGrowth(LEPPA_BERRY?.growthHours ?? 20, rhythmMode);
  const leppaPlants = (characters * LEPPA_PLOTS_PER_CHARACTER) / leppaScheduleDays;
  const leppaBerries = leppaPlants * (LEPPA_BERRY?.yieldPerPlot ?? 6);
  const leppaSellPrice = getLeppaSellPrice(priceState);
  const revenue = leppaBerries * leppaSellPrice;
  const seedBalances = createEmptySeedMap();

  seedBalances[getSeedKey("spicy", "very")] -= leppaPlants;
  seedBalances[getSeedKey("bitter", "plain")] -= leppaPlants;
  seedBalances[getSeedKey("sweet", "plain")] -= leppaPlants;

  const seedLines = buildSeedBalanceLines(seedBalances, priceState);
  const packetQuote = getLeppaSeedPacketQuote(priceState, leppaPlants);
  const buyCostLines = packetQuote.enabled
    ? [
        createLine({
          kind: "leppaPacketBuy",
          label: "Leppa seed packet equivalent",
          quantity: packetQuote.packets,
          unitPrice: packetQuote.price,
          tone: "negative",
        }),
      ]
    : seedLines.costLines;
  const totalCost = packetQuote.enabled ? packetQuote.value : seedLines.boughtSeedValue;
  const dailyValue = revenue - totalCost;

  return {
    routeKey: definition.id,
    ...definition,
    characters,
    leppaCharacters: characters,
    supportCharacters: 0,
    rhythmMode,
    rhythmLabel: getRhythmLabel(rhythmMode),
    leppaSellPrice,
    leppaOutput: { plants: leppaPlants, total: leppaBerries },
    totalRevenue: revenue,
    totalCost,
    soldSeedValue: 0,
    boughtSeedValue: totalCost,
    totalBuyValue: totalCost,
    buyPressure: true,
    buyProfile: packetQuote.enabled ? "Packet buy" : "Seed buy",
    toolsUsed: 0,
    toolCost: 0,
    dailyValue,
    cycleValue: dailyValue,
    profitable: dailyValue > 0,
    supportSummary: packetQuote.enabled
      ? "One direct Leppa day using the Leppa seed packet override from Prices."
      : "One direct Leppa day. Buys Very Spicy, Plain Bitter, and Plain Sweet from Shop prices.",
    supportDetails: [],
    revenueLines: [
      createLine({
        kind: "berrySell",
        label: "Leppa berry sales",
        quantity: leppaBerries,
        unitPrice: leppaSellPrice,
        tone: "berry",
      }),
    ],
    costLines: buyCostLines,
  };
}

function buildSupportRoute(definition, priceState, characters, rhythmMode) {
  const { components } = getRequiredSupport(definition, rhythmMode);
  const leppaScheduleDays = getScheduleDaysForGrowth(LEPPA_BERRY?.growthHours ?? 20, rhythmMode);
  const leppaDaysPerPlant = leppaScheduleDays / LEPPA_PLOTS_PER_CHARACTER;
  const supportDaysPerPlant = components.reduce(
    (sum, component) => sum + component.harvestsPerLeppaPlant * component.harvest.scheduleDays,
    0,
  );
  const totalDaysPerLeppaPlant = leppaDaysPerPlant + supportDaysPerPlant;
  const leppaPlants = characters / totalDaysPerLeppaPlant;
  const leppaCharacters = (leppaPlants * getLeppaStandardDays()) / LEPPA_PLOTS_PER_CHARACTER;
  const supportDetails = [];
  const seedBalances = createEmptySeedMap();
  let toolsUsed = 0;
  let supportCharacters = 0;

  components.forEach((component) => {
    const harvestCount = component.harvestsPerLeppaPlant * leppaPlants;
    const dailyCharacters = harvestCount * component.harvest.scheduleDays;
    const berryCount = harvestCount * component.harvest.berryCount;

    addSeedMap(seedBalances, component.harvest.netSeeds, harvestCount);
    toolsUsed += berryCount;
    supportCharacters += dailyCharacters;
    supportDetails.push({
      label: `${component.harvest.label} · ${component.harvest.method.label}`,
      characters: dailyCharacters,
      berryCount,
    });
  });

  seedBalances[getSeedKey("spicy", "very")] -= leppaPlants;
  seedBalances[getSeedKey("bitter", "plain")] -= leppaPlants;
  seedBalances[getSeedKey("sweet", "plain")] -= leppaPlants;

  const leppaBerries = leppaPlants * (LEPPA_BERRY?.yieldPerPlot ?? 6);
  const leppaSellPrice = getLeppaSellPrice(priceState);
  const leppaRevenue = leppaBerries * leppaSellPrice;
  const toolPrice = getHarvestToolPrice(priceState);
  const toolCost = toolsUsed * toolPrice;
  const seedLines = buildSeedBalanceLines(seedBalances, priceState);
  const totalRevenue = leppaRevenue + seedLines.soldSeedValue;
  const totalCost = toolCost + seedLines.boughtSeedValue;
  const dailyValue = totalRevenue - totalCost;

  return {
    routeKey: definition.id,
    ...definition,
    characters,
    leppaCharacters,
    supportCharacters,
    rhythmMode,
    rhythmLabel: getRhythmLabel(rhythmMode),
    leppaSellPrice,
    leppaOutput: { plants: leppaPlants, total: leppaBerries },
    totalRevenue,
    totalCost,
    soldSeedValue: seedLines.soldSeedValue,
    boughtSeedValue: seedLines.boughtSeedValue,
    totalBuyValue: seedLines.totalBuyValue,
    buyPressure: seedLines.buyPressure,
    buyProfile: seedLines.buyPressure ? "Seed top-up" : "Buy-free",
    toolsUsed,
    toolCost,
    dailyValue,
    cycleValue: dailyValue,
    profitable: dailyValue > 0,
    supportSummary: `${supportCharacters.toFixed(2)} support chars/day → ${leppaCharacters.toFixed(2)} Leppa chars/day. Surplus seeds are valued with Shop sell prices.`,
    supportDetails,
    revenueLines: [
      createLine({
        kind: "berrySell",
        label: "Leppa berry sales",
        quantity: leppaBerries,
        unitPrice: leppaSellPrice,
        tone: "berry",
      }),
      ...seedLines.revenueLines,
    ],
    costLines: [
      createLine({
        kind: "toolCost",
        label: "Harvest Tools",
        quantity: toolsUsed,
        unitPrice: toolPrice,
        tone: "negative",
      }),
      ...seedLines.costLines,
    ],
  };
}

function buildRoute(definition, priceState, characters, rhythmMode) {
  if (definition.strategy === "buy") {
    return buildBuyRoute(definition, priceState, characters, rhythmMode);
  }

  return buildSupportRoute(definition, priceState, characters, rhythmMode);
}

function routeMatches(route, state) {
  if (state.visibility === "profitable" && !route.profitable) {
    return false;
  }

  if (state.family !== "all" && route.family !== state.family) {
    return false;
  }

  const query = normalizeText(state.search);
  if (!query) {
    return true;
  }

  return normalizeText(`${route.label} ${route.familyLabel} ${route.summary}`).includes(query);
}

function sortRoutes(routes, sort) {
  const copy = [...routes];

  copy.sort((left, right) => {
    if (sort === "cycle-desc") {
      return right.cycleValue - left.cycleValue;
    }

    if (sort === "leppa-desc") {
      return right.leppaOutput.total - left.leppaOutput.total;
    }

    if (sort === "name-asc") {
      return left.label.localeCompare(right.label);
    }

    return right.dailyValue - left.dailyValue;
  });

  return copy;
}

function normalizeState(state = {}) {
  return {
    characters: clampNumber(state.characters, DEFAULT_LEPPA_CHARACTERS, 1, 99),
    visibility: state.visibility === "profitable" ? "profitable" : "all",
    family: ["all", "buy", "self", "starf"].includes(state.family) ? state.family : "all",
    sort: ["daily-desc", "cycle-desc", "leppa-desc", "name-asc"].includes(state.sort)
      ? state.sort
      : "daily-desc",
    search: String(state.search || ""),
  };
}

export function getLeppaScenario(state = {}) {
  const safeState = normalizeState(state);
  const priceState = getPriceState();
  const rhythmMode = priceState.assumptions?.rhythmMode === "flow" ? "flow" : "normal";
  const routes = LEPPA_ROUTE_DEFINITIONS.map((definition) =>
    buildRoute(definition, priceState, safeState.characters, rhythmMode),
  );
  const visibleRoutes = sortRoutes(
    routes.filter((route) => routeMatches(route, safeState)),
    safeState.sort,
  );
  const bestRoute = sortRoutes(routes, "daily-desc")[0] ?? null;
  const lowestBuyRoute = [...routes].sort(
    (left, right) => left.totalBuyValue - right.totalBuyValue || right.dailyValue - left.dailyValue,
  )[0];

  return {
    state: { ...safeState, rhythmMode },
    priceState,
    leppaBerry: LEPPA_BERRY,
    characters: safeState.characters,
    routes,
    visibleRoutes,
    bestRoute,
    lowestBuyRoute,
    totalCount: routes.length,
    profitableCount: routes.filter((route) => route.profitable).length,
  };
}
