// assets/js/modules/recipes/variants.js
// v2.0.0-beta
// Shared seed-recipe variant helpers for exact and plain-swap planting methods.
import { FLAVOR_META } from "../pricing/defaults.js";
import { getSeedPrice } from "../pricing/store.js";
import { parseSeedToken } from "../seeds/data.js";

function getRecipeSignature(recipe) {
  return [...recipe].sort().join("|");
}

function buildPlainSwapRecipe(baseRecipe, token, index) {
  const plainSeed = `Plain ${FLAVOR_META[token.flavor].label}`;

  return [...baseRecipe.slice(0, index), plainSeed, plainSeed, ...baseRecipe.slice(index + 1)];
}

function getPlainSwapLabel(recipe) {
  const tokens = recipe.map(parseSeedToken);
  const plainCount = tokens.filter((token) => token.type === "plain").length;
  const veryCount = tokens.filter((token) => token.type === "very").length;
  const flavorCount = new Set(tokens.map((token) => token.flavor)).size;

  if (tokens.length === 3 && plainCount === 3 && flavorCount === 1) {
    return "3 plain";
  }

  if (tokens.length === 3 && plainCount === 2 && veryCount === 1 && flavorCount === 1) {
    return "Very + 2 plain";
  }

  return "Plain swap";
}

export function getRecipeMethods(berry) {
  const baseRecipe = berry?.seedRecipe || [];
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

    const replacement = buildPlainSwapRecipe(baseRecipe, token, index);

    if (replacement.length > 3) {
      return;
    }

    const signature = getRecipeSignature(replacement);

    if (!variants.has(signature)) {
      variants.set(signature, {
        key: `swap-${token.flavor}-${index}`,
        kind: "plain-swap",
        label: getPlainSwapLabel(replacement),
        recipe: replacement,
      });
    }
  });

  return [...methods, ...variants.values()];
}

export function getAlternativeRecipeMethods(berry) {
  return getRecipeMethods(berry).filter((method) => method.kind !== "exact");
}

export function getRecipeSeedCost(recipe, priceState, mode = "buy") {
  return recipe.reduce((sum, seedText) => {
    const parsed = parseSeedToken(seedText);
    return sum + getSeedPrice(priceState, parsed.flavor, parsed.type, mode);
  }, 0);
}

export function getCheapestRecipeMethod(berry, priceState) {
  return [...getRecipeMethods(berry)].sort(
    (left, right) =>
      getRecipeSeedCost(left.recipe, priceState) - getRecipeSeedCost(right.recipe, priceState),
  )[0];
}

export function getRecipeMethodLabel(method) {
  return method?.label || "Exact";
}
