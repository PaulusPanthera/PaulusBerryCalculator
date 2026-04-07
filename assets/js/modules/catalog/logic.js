// assets/js/modules/catalog/logic.js
// v2.0.0-beta
// Filter, sort, summary helpers, and seed breakpoint math for the berry catalog page.
import { FLAVOR_META } from "../pricing/defaults.js";
import { getHarvestOutputProfile } from "../seed-harvest/logic.js";
import {
  getBerryPrice,
  getHarvestToolPrice,
  getPriceState,
  getSeedPrice,
} from "../pricing/store.js";

function normalize(value) {
  return String(value).trim().toLowerCase();
}

function getFlavorFromSeed(seedLabel) {
  return normalize(seedLabel).split(" ").at(-1);
}

function buildSearchText(berry) {
  return [
    berry.name,
    berry.shortName,
    berry.category,
    berry.effect,
    berry.seedRecipe.join(" "),
    berry.growthHours,
    berry.yieldProfile?.join(" ") ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

export function getCatalogOptions(berries) {
  const categories = [...new Set(berries.map((berry) => berry.category))].sort();
  const growthHours = [...new Set(berries.map((berry) => berry.growthHours))].sort((a, b) => a - b);
  const flavors = [
    ...new Set(berries.flatMap((berry) => berry.seedRecipe.map(getFlavorFromSeed))),
  ].sort();

  return {
    categories,
    growthHours,
    flavors,
  };
}

export function applyCatalogState(berries, state) {
  const query = normalize(state.query);

  const filtered = berries.filter((berry) => {
    if (query && !buildSearchText(berry).includes(query)) {
      return false;
    }

    if (state.category !== "all" && berry.category !== state.category) {
      return false;
    }

    if (state.growth !== "all" && berry.growthHours !== Number(state.growth)) {
      return false;
    }

    if (
      state.flavor !== "all" &&
      !berry.seedRecipe.some((seedLabel) => getFlavorFromSeed(seedLabel) === state.flavor)
    ) {
      return false;
    }

    return true;
  });

  return sortBerries(filtered, state.sort);
}

export function sortBerries(berries, sortKey) {
  const sorted = [...berries];

  switch (sortKey) {
    case "vendor-desc":
      return sorted.sort(
        (left, right) =>
          right.vendorPrice - left.vendorPrice || left.name.localeCompare(right.name),
      );
    case "growth-asc":
      return sorted.sort(
        (left, right) =>
          left.growthHours - right.growthHours || left.name.localeCompare(right.name),
      );
    case "yield-desc":
      return sorted.sort(
        (left, right) =>
          right.yieldPerPlot - left.yieldPerPlot || left.name.localeCompare(right.name),
      );
    case "name-asc":
    default:
      return sorted.sort((left, right) => left.name.localeCompare(right.name));
  }
}

export function getHeroSummary(berries) {
  const fastest = [...berries].sort(
    (left, right) => left.growthHours - right.growthHours || left.name.localeCompare(right.name),
  )[0];
  const slowest = [...berries].sort(
    (left, right) => right.growthHours - left.growthHours || left.name.localeCompare(right.name),
  )[0];
  const averageVendor = Math.round(
    berries.reduce((total, berry) => total + berry.vendorPrice, 0) / Math.max(berries.length, 1),
  );

  return {
    total: berries.length,
    averageVendor,
    fastest,
    slowest,
  };
}

export function getBerryBySlug(berries, slug) {
  return berries.find((berry) => berry.slug === slug) ?? null;
}

export function getSeedHarvestSummary(berry, priceState = getPriceState()) {
  const { profile } = getHarvestOutputProfile(berry.seedRecipe);
  const flavorBreakdown = Object.values(profile)
    .filter((entry) => entry.share > 0)
    .map((entry) => {
      const plainBuy = getSeedPrice(priceState, entry.flavor, "plain", "buy");
      const veryBuy = getSeedPrice(priceState, entry.flavor, "very", "buy");
      const expectedBuyValue = plainBuy * entry.plainRate + veryBuy * entry.veryRate;

      return {
        flavor: entry.flavor,
        label: FLAVOR_META[entry.flavor]?.label || entry.flavor,
        share: entry.share,
        plainShare: entry.plainShare,
        veryShare: entry.veryShare,
        canRollVery: entry.canRollVery,
        plainBuy,
        veryBuy,
        expectedBuyValue,
      };
    });
  const flavors = flavorBreakdown.map((entry) => entry.flavor);
  const flavorShare = flavorBreakdown.length > 0 ? flavorBreakdown[0].share : 0;
  const harvestToolCost = getHarvestToolPrice();
  const expectedSeedBuyValue = flavorBreakdown.reduce(
    (sum, entry) => sum + entry.expectedBuyValue * entry.share,
    0,
  );
  const breakEvenBerryBuy = Math.max(0, expectedSeedBuyValue - harvestToolCost);
  const currentBerryBuy = getBerryPrice(priceState, berry, "buy");
  const currentTotalCost = currentBerryBuy + harvestToolCost;
  const currentEdge = expectedSeedBuyValue - currentTotalCost;

  return {
    flavors,
    flavorBreakdown,
    flavorShare,
    harvestToolCost,
    expectedSeedBuyValue,
    breakEvenBerryBuy,
    currentBerryBuy,
    currentTotalCost,
    currentEdge,
    isWorthBuying: currentEdge > 0.001,
    isBlended: flavors.length > 1,
  };
}
