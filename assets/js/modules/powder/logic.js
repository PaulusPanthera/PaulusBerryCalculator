// assets/js/modules/powder/logic.js
// v2.0.0-beta
// Calculations for berry powder crafting routes with shared Shop prices.
import { BERRIES } from "../catalog/data.js";
import { FLAVOR_META } from "../pricing/defaults.js";
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

function getRecipeMethods(berry) {
  const baseRecipe = berry.seedRecipe;
  const methods = [{ key: "exact", kind: "exact", label: "Exact", recipe: baseRecipe }];

  if (baseRecipe.length !== 2) {
    return methods;
  }

  const variants = new Map();
  const recipeTokens = baseRecipe.map(parseSeed);

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
        label: "Very + 2 plain",
        recipe: replacement,
      });
    }
  });

  return [...methods, ...variants.values()];
}

function getRecipeUnitCost(priceState, recipe) {
  return recipe.reduce((sum, seedText) => {
    const parsed = parseSeed(seedText);
    return sum + getSeedPrice(priceState, parsed.flavor, parsed.type, "buy");
  }, 0);
}

function getPlantCost(priceState, berry, totalPlots) {
  const method = [...getRecipeMethods(berry)].sort(
    (left, right) =>
      getRecipeUnitCost(priceState, left.recipe) - getRecipeUnitCost(priceState, right.recipe),
  )[0];
  const unitCost = getRecipeUnitCost(priceState, method.recipe);

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

function buildPowderRoute(priceState, berry, target, characters) {
  const totalPlots = PLOTS_PER_CHARACTER * characters;
  const standardDays = getStandardDays(berry.growthHours);
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
