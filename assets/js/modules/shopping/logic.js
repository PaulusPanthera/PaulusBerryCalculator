// assets/js/modules/shopping/logic.js
// v2.0.0-beta
// Shopping list planning logic for berry cart entries, recipe variants, seed totals, and buy-cost summaries.
import { BERRIES } from "../catalog/data.js";
import { FLAVOR_META, FLAVOR_ORDER } from "../pricing/defaults.js";
import { getBerryPrice, getPriceState, getSeedPrice } from "../pricing/store.js";
import {
  getStandardDaysForGrowth,
  parseSeedToken,
  STANDARD_PLOTS_PER_CHARACTER,
} from "../seeds/data.js";

const SHOPPING_STORAGE_KEY = "paulus-berry-calculator-shopping-state-v1";

function clampInteger(value, fallback, min, max) {
  const parsed = Math.round(Number(value));

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}

function createEmptySeedCounts() {
  const output = {};

  for (const flavor of FLAVOR_ORDER) {
    output[flavor] = { plain: 0, very: 0 };
  }

  return output;
}

function createEmptyInventory() {
  return createEmptySeedCounts();
}

function normalizeInventory(input) {
  const output = createEmptyInventory();

  for (const flavor of FLAVOR_ORDER) {
    output[flavor].plain = clampInteger(input?.[flavor]?.plain, 0, 0, 9999999);
    output[flavor].very = clampInteger(input?.[flavor]?.very, 0, 0, 9999999);
  }

  return output;
}

function getMethodLabel(method) {
  return method.kind === "plain-swap" ? "Plain swap" : "Exact";
}

function getRecipeMethods(berry) {
  const baseRecipe = berry.seedRecipe;
  const methods = [
    {
      key: "exact",
      kind: "exact",
      label: "Exact",
      recipe: baseRecipe,
    },
  ];

  if (baseRecipe.length !== 2) {
    return methods;
  }

  const variants = new Map();
  const recipeTokens = baseRecipe.map(parseSeedToken);

  recipeTokens.forEach((token, index) => {
    if (token.type !== "very") {
      return;
    }

    const replacement = [
      ...baseRecipe.slice(0, index),
      `Plain ${FLAVOR_META[token.flavor].label}`,
      `Plain ${FLAVOR_META[token.flavor].label}`,
      ...baseRecipe.slice(index + 1),
    ];

    if (replacement.length > 3) {
      return;
    }

    const signature = [...replacement].sort().join("|");

    if (!variants.has(signature)) {
      variants.set(signature, {
        key: `swap-${token.flavor}-${index}`,
        kind: "plain-swap",
        label: "Plain swap",
        recipe: replacement,
      });
    }
  });

  return [...methods, ...variants.values()];
}

function normalizeEntry(entry) {
  const berry = BERRIES.find((candidate) => candidate.slug === entry?.berrySlug) || BERRIES[0];
  const methods = getRecipeMethods(berry);
  const fallbackMethod = methods[0];
  const selectedMethod =
    methods.find((method) => method.key === entry?.methodKey) || fallbackMethod;

  return {
    id: String(entry?.id || `${berry.slug}-${Date.now()}`),
    berrySlug: berry.slug,
    methodKey: selectedMethod.key,
    characters: clampInteger(entry?.characters, 1, 1, 99),
    plantings: clampInteger(entry?.plantings, 1, 1, 999),
  };
}

function getDefaultBerrySlug() {
  return BERRIES.find((berry) => berry.slug === "leppa")?.slug || BERRIES[0]?.slug || "leppa";
}

function cloneDefaultShoppingState() {
  return {
    draftBerrySlug: getDefaultBerrySlug(),
    draftMethodKey: "exact",
    draftCharacters: 1,
    draftPlantings: 1,
    entries: [],
    inventory: createEmptyInventory(),
  };
}

function normalizeShoppingState(state) {
  const defaults = cloneDefaultShoppingState();
  const berry =
    BERRIES.find((candidate) => candidate.slug === state?.draftBerrySlug) ||
    BERRIES.find((candidate) => candidate.slug === getDefaultBerrySlug()) ||
    BERRIES[0];
  const methods = getRecipeMethods(berry);
  const entryList = Array.isArray(state?.entries) ? state.entries.map(normalizeEntry) : [];

  return {
    draftBerrySlug: berry?.slug || defaults.draftBerrySlug,
    draftMethodKey: methods.some((method) => method.key === state?.draftMethodKey)
      ? state.draftMethodKey
      : methods[0]?.key || "exact",
    draftCharacters: clampInteger(state?.draftCharacters, defaults.draftCharacters, 1, 99),
    draftPlantings: clampInteger(state?.draftPlantings, defaults.draftPlantings, 1, 999),
    entries: entryList,
    inventory: normalizeInventory(state?.inventory),
  };
}

export function getShoppingState() {
  try {
    const raw = localStorage.getItem(SHOPPING_STORAGE_KEY);

    if (!raw) {
      return cloneDefaultShoppingState();
    }

    return normalizeShoppingState(JSON.parse(raw));
  } catch {
    return cloneDefaultShoppingState();
  }
}

export function saveShoppingState(state) {
  localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(normalizeShoppingState(state)));
}

export function resetShoppingState() {
  const defaults = cloneDefaultShoppingState();
  saveShoppingState(defaults);
  return defaults;
}

export function getShoppingBerryOptions() {
  return [...BERRIES].sort((left, right) => left.shortName.localeCompare(right.shortName));
}

export function getShoppingMethodOptions(berrySlug) {
  const berry = BERRIES.find((candidate) => candidate.slug === berrySlug) || BERRIES[0];
  return getRecipeMethods(berry);
}

function getEntrySeedCounts(recipe, totalPlots) {
  const counts = createEmptySeedCounts();

  recipe.forEach((token) => {
    const parsed = parseSeedToken(token);
    counts[parsed.flavor][parsed.type] += totalPlots;
  });

  return counts;
}

function getSeedCountTotals(seedCounts, priceState, inventory) {
  const rows = [];
  let totalNeed = 0;
  let totalBuyCount = 0;
  let totalBuyCost = 0;

  for (const flavor of FLAVOR_ORDER) {
    for (const type of ["plain", "very"]) {
      const need = seedCounts[flavor][type];
      const inBag = inventory[flavor][type];
      const buy = Math.max(0, need - inBag);
      const price = getSeedPrice(priceState, flavor, type, "buy");
      const cost = buy * price;
      const meta = FLAVOR_META[flavor];

      rows.push({
        flavor,
        type,
        label: type === "very" ? meta.veryLabel : meta.plainLabel,
        icon: type === "very" ? meta.veryIcon : meta.plainIcon,
        need,
        inBag,
        buy,
        price,
        cost,
      });

      totalNeed += need;
      totalBuyCount += buy;
      totalBuyCost += cost;
    }
  }

  return {
    rows,
    totalNeed,
    totalBuyCount,
    totalBuyCost,
  };
}

function evaluateEntry(entry, priceState) {
  const berry = BERRIES.find((candidate) => candidate.slug === entry.berrySlug);

  if (!berry) {
    return null;
  }

  const methods = getRecipeMethods(berry);
  const method = methods.find((candidate) => candidate.key === entry.methodKey) || methods[0];
  const totalRuns = entry.characters * entry.plantings;
  const totalPlots = totalRuns * STANDARD_PLOTS_PER_CHARACTER;
  const seedCounts = getEntrySeedCounts(method.recipe, totalPlots);
  let seedCost = 0;

  for (const flavor of FLAVOR_ORDER) {
    seedCost += seedCounts[flavor].plain * getSeedPrice(priceState, flavor, "plain", "buy");
    seedCost += seedCounts[flavor].very * getSeedPrice(priceState, flavor, "very", "buy");
  }

  const totalBerries = berry.yieldPerPlot * totalPlots;
  const currentSellPrice = getBerryPrice(priceState, berry, "sell");
  const grossSellValue = totalBerries * currentSellPrice;
  const vendorValue = totalBerries * berry.vendorPrice;

  return {
    ...entry,
    berry,
    method,
    methodLabel: getMethodLabel(method),
    totalRuns,
    totalPlots,
    totalBerries,
    seedCounts,
    seedCost,
    currentSellPrice,
    grossSellValue,
    vendorValue,
    standardDays: getStandardDaysForGrowth(berry.growthHours),
  };
}

export function getShoppingPlan(state, priceState = getPriceState()) {
  const normalized = normalizeShoppingState(state);
  const entries = normalized.entries
    .map((entry) => evaluateEntry(entry, priceState))
    .filter(Boolean);
  const aggregateCounts = createEmptySeedCounts();
  let totalPlots = 0;
  let totalRuns = 0;
  let totalSeedCost = 0;
  let totalGrossSellValue = 0;
  let totalVendorValue = 0;

  for (const entry of entries) {
    totalPlots += entry.totalPlots;
    totalRuns += entry.totalRuns;
    totalSeedCost += entry.seedCost;
    totalGrossSellValue += entry.grossSellValue;
    totalVendorValue += entry.vendorValue;

    for (const flavor of FLAVOR_ORDER) {
      aggregateCounts[flavor].plain += entry.seedCounts[flavor].plain;
      aggregateCounts[flavor].very += entry.seedCounts[flavor].very;
    }
  }

  const seedTotals = getSeedCountTotals(aggregateCounts, priceState, normalized.inventory);

  return {
    entries,
    totalEntries: entries.length,
    totalPlots,
    totalRuns,
    totalSeedCost,
    totalGrossSellValue,
    totalVendorValue,
    aggregateCounts,
    inventory: normalized.inventory,
    seedTotals,
  };
}

export function addShoppingEntry(state, values) {
  const normalized = normalizeShoppingState(state);
  const berry = BERRIES.find((candidate) => candidate.slug === values.berrySlug) || BERRIES[0];
  const methods = getRecipeMethods(berry);
  const method = methods.find((candidate) => candidate.key === values.methodKey) || methods[0];

  normalized.entries.push(
    normalizeEntry({
      id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      berrySlug: berry.slug,
      methodKey: method.key,
      characters: values.characters,
      plantings: values.plantings,
    }),
  );

  normalized.draftBerrySlug = berry.slug;
  normalized.draftMethodKey = method.key;
  normalized.draftCharacters = clampInteger(values.characters, normalized.draftCharacters, 1, 99);
  normalized.draftPlantings = clampInteger(values.plantings, normalized.draftPlantings, 1, 999);

  return normalized;
}

export function removeShoppingEntry(state, entryId) {
  const normalized = normalizeShoppingState(state);
  normalized.entries = normalized.entries.filter((entry) => entry.id !== entryId);
  return normalized;
}

export function updateShoppingDraft(state, updates) {
  const normalized = normalizeShoppingState(state);
  const nextBerrySlug = updates.draftBerrySlug || normalized.draftBerrySlug;
  const nextMethods = getShoppingMethodOptions(nextBerrySlug);
  const requestedMethod = updates.draftMethodKey || normalized.draftMethodKey;

  normalized.draftBerrySlug = nextBerrySlug;
  normalized.draftMethodKey = nextMethods.some((method) => method.key === requestedMethod)
    ? requestedMethod
    : nextMethods[0]?.key || "exact";

  if (Object.hasOwn(updates, "draftCharacters")) {
    normalized.draftCharacters = clampInteger(
      updates.draftCharacters,
      normalized.draftCharacters,
      1,
      99,
    );
  }

  if (Object.hasOwn(updates, "draftPlantings")) {
    normalized.draftPlantings = clampInteger(
      updates.draftPlantings,
      normalized.draftPlantings,
      1,
      999,
    );
  }

  return normalized;
}

export function updateShoppingInventory(state, flavor, type, value) {
  const normalized = normalizeShoppingState(state);

  if (!FLAVOR_ORDER.includes(flavor)) {
    return normalized;
  }

  const safeType = type === "very" ? "very" : "plain";
  normalized.inventory[flavor][safeType] = clampInteger(value, 0, 0, 9999999);
  return normalized;
}

export function clearShoppingEntries(state) {
  const normalized = normalizeShoppingState(state);
  normalized.entries = [];
  return normalized;
}

export function resetShoppingInventory(state) {
  const normalized = normalizeShoppingState(state);
  normalized.inventory = createEmptyInventory();
  return normalized;
}

export { SHOPPING_STORAGE_KEY };
