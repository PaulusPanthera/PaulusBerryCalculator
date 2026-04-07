// assets/js/modules/seed-harvest/logic.js
// v2.0.0-beta
// Shared harvested-seed expectation helpers using weighted flavor points and the 1-point plain-only / 2+ point 70-30 rule.
import { FLAVOR_ORDER } from "../pricing/defaults.js";
import { parseSeedToken } from "../seeds/data.js";

export const DEFAULT_HARVEST_PLAIN_RATE = 0.7;
export const DEFAULT_HARVEST_VERY_RATE = 0.3;

function clampRate(value, fallback) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, 0), 1);
}

function normalizeRecipeTokens(recipeTokens) {
  return recipeTokens.map((token) => (typeof token === "string" ? parseSeedToken(token) : token));
}

export function getHarvestRecipeCounts(recipeTokens) {
  const counts = {};

  for (const flavor of FLAVOR_ORDER) {
    counts[flavor] = { plain: 0, very: 0, total: 0, weight: 0, canRollVery: false };
  }

  for (const token of normalizeRecipeTokens(recipeTokens)) {
    counts[token.flavor][token.type] += 1;
    counts[token.flavor].total += 1;
    counts[token.flavor].weight += token.type === "very" ? 2 : 1;
    counts[token.flavor].canRollVery = counts[token.flavor].weight >= 2;
  }

  return counts;
}

export function getHarvestOutputProfile(recipeTokens, veryRate = DEFAULT_HARVEST_VERY_RATE) {
  const recipeCounts = getHarvestRecipeCounts(recipeTokens);
  const normalizedVeryRate = clampRate(veryRate, DEFAULT_HARVEST_VERY_RATE);
  const normalizedPlainRate = 1 - normalizedVeryRate;
  const totalWeight = FLAVOR_ORDER.reduce((sum, flavor) => sum + recipeCounts[flavor].weight, 0);
  const profile = {};

  for (const flavor of FLAVOR_ORDER) {
    const entry = recipeCounts[flavor];
    const share = totalWeight > 0 ? entry.weight / totalWeight : 0;
    const canRollVery = entry.weight >= 2;
    const plainRate = canRollVery ? normalizedPlainRate : entry.weight > 0 ? 1 : 0;
    const flavorVeryRate = canRollVery ? normalizedVeryRate : 0;

    profile[flavor] = {
      flavor,
      share,
      weight: entry.weight,
      canRollVery,
      plainRate,
      veryRate: flavorVeryRate,
      plainShare: share * plainRate,
      veryShare: share * flavorVeryRate,
    };
  }

  return {
    recipeCounts,
    profile,
  };
}

export function getHarvestOutputsByFlavor(totalBerries, recipeTokens, veryRate) {
  const { recipeCounts, profile } = getHarvestOutputProfile(recipeTokens, veryRate);
  const output = {};

  for (const flavor of FLAVOR_ORDER) {
    output[flavor] = {
      share: profile[flavor].share,
      plain: totalBerries * profile[flavor].plainShare,
      very: totalBerries * profile[flavor].veryShare,
    };
  }

  return {
    recipeCounts,
    profile,
    output,
  };
}
