// assets/js/modules/powder/logic.js
// v2.0.0-beta
// Calculations for berry powder crafting routes with shared Shop prices.
import { BERRIES } from "../catalog/data.js";
import {
  getPowderBerryBuyPrice,
  getPowderIngredientPrice,
  getPowderTargetPrice,
  getPriceState,
  getSeedPrice,
} from "../pricing/store.js";
import { getPowderTarget } from "./data.js";

const PLOTS_PER_CHARACTER = 156;

function getStandardDays(growthHours) {
  if (growthHours >= 67) return 3;
  if (growthHours >= 42) return 2;
  return 1;
}

function parseSeed(seedText) {
  const [type, flavor] = seedText.toLowerCase().split(" ");
  return { type: type === "very" ? "very" : "plain", flavor };
}

function getPlantCost(priceState, berry, totalPlots) {
  const unitCost = berry.seedRecipe.reduce((sum, seedText) => {
    const parsed = parseSeed(seedText);
    return sum + getSeedPrice(priceState, parsed.flavor, parsed.type, "buy");
  }, 0);

  return unitCost * totalPlots;
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

function buildPowderRoute(priceState, berry, target, characters) {
  const totalPlots = PLOTS_PER_CHARACTER * characters;
  const standardDays = getStandardDays(berry.growthHours);
  const totalBerries = berry.yieldPerPlot * totalPlots;
  const itemYield = totalBerries / target.powderPerItem;
  const itemSell = getPowderTargetPrice(priceState, target.priceKey);
  const ingredient1 = getIngredientBreakdown(priceState, target.ingredient1, itemYield);
  const ingredient2 = getIngredientBreakdown(priceState, target.ingredient2, itemYield);
  const plantCost = getPlantCost(priceState, berry, totalPlots);
  const totalCost = plantCost + (ingredient1?.cost ?? 0) + (ingredient2?.cost ?? 0);
  const revenue = itemYield * itemSell;
  const cycleValue = revenue - totalCost;
  const dailyValue = cycleValue / standardDays;

  return {
    routeKey: `${berry.slug}--${target.id}`,
    berry,
    target,
    characters,
    standardDays,
    totalPlots,
    totalBerries,
    itemYield,
    itemSell,
    ingredient1,
    ingredient2,
    plantCost,
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

export function getPowderScenario(state) {
  const priceState = getPriceState();
  const target = getPowderTarget(state.targetId);
  const allRoutes = BERRIES.map((berry) =>
    buildPowderRoute(priceState, berry, target, state.characters),
  );

  let visibleRoutes = allRoutes.filter((route) => matchesQuery(route, state.search));

  if (state.visibility === "profitable") {
    visibleRoutes = visibleRoutes.filter((route) => route.profitable);
  }

  if (state.standardDays !== "all") {
    visibleRoutes = visibleRoutes.filter(
      (route) => String(route.standardDays) === state.standardDays,
    );
  }

  visibleRoutes = sortRoutes(visibleRoutes, state.sort);

  return {
    priceState,
    target,
    characters: state.characters,
    visibleRoutes,
    totalCount: allRoutes.length,
    profitableCount: allRoutes.filter((route) => route.profitable).length,
  };
}
