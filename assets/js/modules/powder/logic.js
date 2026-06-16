// assets/js/modules/powder/logic.js
// v2.0.0-beta
// Calculations for berry powder crafting routes with shared Shop prices.
import { BERRIES } from "../catalog/data.js";
import {
  getPowderBerryBuyPrice,
  getPowderIngredientPrice,
  getPowderTargetPrice,
  getPriceState,
} from "../pricing/store.js";
import { getCheapestRecipeMethod, getRecipeSeedCost } from "../recipes/variants.js";
import { getScheduleDaysForGrowth } from "../settings/rhythm.js";
import { getPowderTarget, POWDER_TARGETS } from "./data.js";

const PLOTS_PER_CHARACTER = 156;

function clampNumber(value, fallback, min, max) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}

function getStandardDays(growthHours) {
  if (growthHours >= 67) return 3;
  if (growthHours >= 42) return 2;
  return 1;
}

function getPlantCost(priceState, berry, totalPlots) {
  const method = getCheapestRecipeMethod(berry, priceState);
  const unitCost = getRecipeSeedCost(method.recipe, priceState);

  return {
    method,
    plantCost: unitCost * totalPlots,
  };
}
function getBerryBySlug(slug) {
  return BERRIES.find((entry) => entry.slug === slug) ?? null;
}

function getIngredientUnitPrice(priceState, ingredient) {
  if (!ingredient) return 0;
  if (ingredient.source === "berry") {
    const berry = getBerryBySlug(ingredient.key);
    return berry ? getPowderBerryBuyPrice(priceState, berry) : 0;
  }
  return getPowderIngredientPrice(priceState, ingredient.key);
}

function getIngredientBreakdown(priceState, ingredient, itemYield) {
  if (!ingredient) return null;
  const quantity = itemYield * ingredient.ratio;
  const unitPrice = getIngredientUnitPrice(priceState, ingredient);
  return { ...ingredient, quantity, unitPrice, cost: quantity * unitPrice };
}

function buildPowderRoute(priceState, berry, target, characters, rhythmMode) {
  const totalPlots = PLOTS_PER_CHARACTER * characters;
  const standardDays = getStandardDays(berry.growthHours);
  const scheduleDays = getScheduleDaysForGrowth(berry.growthHours, rhythmMode);
  const totalBerries = berry.yieldPerPlot * totalPlots;
  const itemYield = totalBerries / target.powderPerItem;
  const itemSell = getPowderTargetPrice(priceState, target.priceKey);
  const ingredient1 = getIngredientBreakdown(priceState, target.ingredient1, itemYield);
  const ingredient2 = getIngredientBreakdown(priceState, target.ingredient2, itemYield);
  const plant = getPlantCost(priceState, berry, totalPlots);
  const plantCost = plant.plantCost;
  const totalCost = plantCost + (ingredient1?.cost ?? 0) + (ingredient2?.cost ?? 0);
  const revenue = itemYield * itemSell;
  const cycleValue = revenue - totalCost;
  const dailyValue = cycleValue / scheduleDays;

  return {
    routeKey: `${berry.slug}--${target.id}`,
    berry,
    target,
    characters,
    standardDays,
    scheduleDays,
    rhythmMode,
    totalPlots,
    totalBerries,
    itemYield,
    itemSell,
    ingredient1,
    ingredient2,
    plantCost,
    recipe: plant.method.recipe,
    recipeMethodKey: plant.method.key,
    recipeMethodLabel: plant.method.label,
    totalCost,
    revenue,
    cycleValue,
    dailyValue,
    profitable: dailyValue > 0,
  };
}

function matchesQuery(route, query) {
  if (!query) return true;
  const haystack =
    `${route.berry.shortName} ${route.berry.category} ${route.target.label}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function sortRoutes(routes, sort) {
  const copy = [...routes];
  copy.sort((left, right) => {
    switch (sort) {
      case "name-asc":
        return left.berry.shortName.localeCompare(right.berry.shortName);
      case "cost-asc":
        return left.totalCost - right.totalCost;
      case "yield-desc":
        return right.itemYield - left.itemYield;
      case "daily-desc":
      default:
        return right.dailyValue - left.dailyValue;
    }
  });
  return copy;
}

function getSafePowderState(state = {}) {
  const targetIds = POWDER_TARGETS.map((target) => target.id);
  const targetId = targetIds.includes(state.targetId) ? state.targetId : POWDER_TARGETS[0]?.id;
  const characters = clampNumber(state.characters, 1, 1, 99);
  const standardDays = ["all", "1", "2", "3"].includes(String(state.standardDays))
    ? String(state.standardDays)
    : "all";
  const sortOptions = ["daily-desc", "name-asc", "cost-asc", "yield-desc"];

  return {
    targetId,
    characters,
    search: String(state.search || ""),
    visibility: state.visibility === "profitable" ? "profitable" : "all",
    standardDays,
    sort: sortOptions.includes(state.sort) ? state.sort : "daily-desc",
  };
}

export function getPowderScenario(state = {}) {
  const safeState = getSafePowderState(state);
  const priceState = getPriceState();
  const rhythmMode = priceState.assumptions?.rhythmMode === "flow" ? "flow" : "normal";
  const target = getPowderTarget(safeState.targetId);
  const allRoutes = BERRIES.map((berry) =>
    buildPowderRoute(priceState, berry, target, safeState.characters, rhythmMode),
  );

  let visibleRoutes = allRoutes.filter((route) => matchesQuery(route, safeState.search));

  if (safeState.visibility === "profitable") {
    visibleRoutes = visibleRoutes.filter((route) => route.profitable);
  }

  if (safeState.standardDays !== "all") {
    visibleRoutes = visibleRoutes.filter(
      (route) => String(route.standardDays) === safeState.standardDays,
    );
  }

  visibleRoutes = sortRoutes(visibleRoutes, safeState.sort);

  return {
    priceState,
    target,
    characters: safeState.characters,
    rhythmMode,
    visibleRoutes,
    totalCount: allRoutes.length,
    profitableCount: allRoutes.filter((route) => route.profitable).length,
  };
}
