// assets/js/modules/berries/logic.js
// v2.0.0-beta
// Berry selling route calculations with simple buy-seed math and first-pass self-sufficient loops for pure-color berries.
import { BERRIES } from "../catalog/data.js";
import { FLAVOR_META, FLAVOR_ORDER } from "../pricing/defaults.js";
import {
  getBerryPrice,
  getHarvestToolPrice,
  getPriceState,
  getSeedPrice,
} from "../pricing/store.js";
import { getHarvestOutputsByFlavor } from "../seed-harvest/logic.js";
import {
  DEFAULT_VERY_RATE_PERCENT,
  getStandardDaysForGrowth,
  parseSeedToken,
  STANDARD_PLOTS_PER_CHARACTER,
} from "../seeds/data.js";

function clampNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}

function getRecipeCounts(recipeTokens) {
  const counts = {};
  for (const flavor of FLAVOR_ORDER) {
    counts[flavor] = { plain: 0, very: 0, total: 0 };
  }
  for (const token of recipeTokens) {
    counts[token.flavor][token.type] += 1;
    counts[token.flavor].total += 1;
  }
  return counts;
}

function getUniqueFlavors(recipeCounts) {
  return FLAVOR_ORDER.filter((flavor) => recipeCounts[flavor].total > 0);
}

function getNetSeeds(outputByFlavor, recipeCounts, totalPlots) {
  const net = {};
  for (const flavor of FLAVOR_ORDER) {
    net[flavor] = {
      plain: outputByFlavor[flavor].plain - recipeCounts[flavor].plain * totalPlots,
      very: outputByFlavor[flavor].very - recipeCounts[flavor].very * totalPlots,
    };
  }
  return net;
}

function getMethodLabel(method, recipeCounts, flavor) {
  const selected = recipeCounts[flavor];
  if (method.kind === "exact") {
    if (selected.plain === 0 && selected.very === 2) {
      return "Rebuy";
    }
    if (selected.plain >= 1 && selected.very >= 1) {
      return "Balanced";
    }
    return "Exact";
  }
  if (selected.plain === 3 && selected.very === 0) {
    return "Very focus";
  }
  if (selected.plain === 2 && selected.very === 1) {
    return "Balanced";
  }
  return "Plain swap";
}

function getSeedMethodOptions(berry) {
  const baseRecipe = berry.seedRecipe;
  const methods = [{ key: "exact", kind: "exact", recipe: baseRecipe }];

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
        recipe: replacement,
      });
    }
  });

  return [...methods, ...variants.values()];
}

function getSeedPrepCandidates(flavor, totalPlots, veryRate) {
  const candidates = [];

  for (const berry of BERRIES) {
    for (const method of getSeedMethodOptions(berry)) {
      const recipeTokens = method.recipe.map(parseSeedToken);
      const recipeCounts = getRecipeCounts(recipeTokens);
      const activeFlavors = getUniqueFlavors(recipeCounts);

      if (activeFlavors.length !== 1 || activeFlavors[0] !== flavor) {
        continue;
      }

      const totalBerries = berry.yieldPerPlot * totalPlots;
      const { output: outputByFlavor } = getHarvestOutputsByFlavor(
        totalBerries,
        recipeTokens,
        veryRate,
      );
      const netSeeds = getNetSeeds(outputByFlavor, recipeCounts, totalPlots);
      const selectedNet = netSeeds[flavor];

      if (selectedNet.plain < -0.001 || selectedNet.very < -0.001) {
        continue;
      }

      candidates.push({
        routeKey: `${berry.slug}:${method.key}`,
        berrySlug: berry.slug,
        shortName: berry.shortName,
        sprite: `../assets/img/berries/${berry.slug}.png`,
        methodKey: method.key,
        methodLabel: getMethodLabel(method, recipeCounts, flavor),
        recipe: method.recipe,
        growthHours: berry.growthHours,
        standardDays: getStandardDaysForGrowth(berry.growthHours),
        totalBerries,
        toolCost: totalBerries * getHarvestToolPrice(),
        netPlain: selectedNet.plain,
        netVery: selectedNet.very,
      });
    }
  }

  return candidates;
}

function getRecipeBreakdown(recipeTokens, totalPlots, priceState) {
  return recipeTokens.map((token) => {
    const parsed = parseSeedToken(token);
    const buy = getSeedPrice(priceState, parsed.flavor, parsed.type, "buy");

    return {
      token,
      buy,
      cycleCost: buy * totalPlots,
      parsed,
    };
  });
}

function getSeedSpendPerCycle(recipeTokens, totalPlots, priceState) {
  return getRecipeBreakdown(recipeTokens, totalPlots, priceState).reduce(
    (sum, entry) => sum + entry.cycleCost,
    0,
  );
}

function createBuySeedsRoute(berry, totalPlots, totalCharacters, priceState) {
  const totalBerries = berry.yieldPerPlot * totalPlots;
  const standardDays = getStandardDaysForGrowth(berry.growthHours);
  const sellPrice = getBerryPrice(priceState, berry, "sell");
  const seedSpend = getSeedSpendPerCycle(berry.seedRecipe, totalPlots, priceState);
  const revenue = totalBerries * sellPrice;
  const cycleValue = revenue - seedSpend;
  const dailyValue = cycleValue / standardDays;

  return {
    berrySlug: berry.slug,
    routeKey: `${berry.slug}::buy`,
    methodKey: "buy",
    methodLabel: "Buy seeds",
    methodSubtitle: "Buy the recipe every cycle",
    shortName: berry.shortName,
    category: berry.category,
    effect: berry.effect,
    sprite: `../assets/img/berries/${berry.slug}.png`,
    sellPrice,
    vendorPrice: berry.vendorPrice,
    totalBerries,
    averageYield: berry.yieldPerPlot,
    yieldProfile: berry.yieldProfile,
    growthHours: berry.growthHours,
    standardDays,
    bundleDays: standardDays,
    totalPlots,
    recipe: berry.seedRecipe,
    recipeBreakdown: getRecipeBreakdown(berry.seedRecipe, totalPlots, priceState),
    seedSpend,
    revenue,
    cycleValue,
    dailyValue,
    perCharacterDaily: dailyValue / totalCharacters,
    profitable: dailyValue > 0,
    isSelfSufficient: false,
    availability: "all",
    pureLoop: false,
  };
}

function createSelfSufficientRoute(berry, totalPlots, totalCharacters, priceState, veryRate) {
  const recipeTokens = berry.seedRecipe.map(parseSeedToken);
  const recipeCounts = getRecipeCounts(recipeTokens);
  const activeFlavors = getUniqueFlavors(recipeCounts);

  if (activeFlavors.length !== 1) {
    return null;
  }

  const flavor = activeFlavors[0];
  const needPlain = recipeCounts[flavor].plain * totalPlots;
  const needVery = recipeCounts[flavor].very * totalPlots;
  const candidates = getSeedPrepCandidates(flavor, totalPlots, veryRate).filter(
    (candidate) =>
      (needPlain <= 0 || candidate.netPlain > 0.001) &&
      (needVery <= 0 || candidate.netVery > 0.001),
  );

  if (candidates.length === 0) {
    return null;
  }

  const totalBerries = berry.yieldPerPlot * totalPlots;
  const berryDays = getStandardDaysForGrowth(berry.growthHours);
  const sellPrice = getBerryPrice(priceState, berry, "sell");
  const revenue = totalBerries * sellPrice;

  const routes = candidates.map((candidate) => {
    const plainRatio = needPlain > 0 ? needPlain / candidate.netPlain : 0;
    const veryRatio = needVery > 0 ? needVery / candidate.netVery : 0;
    const seedCycles = Math.max(plainRatio, veryRatio, 0);
    const prepDays = seedCycles * candidate.standardDays;
    const prepToolCost = seedCycles * candidate.toolCost;
    const bundleDays = berryDays + prepDays;
    const cycleValue = revenue - prepToolCost;
    const dailyValue = bundleDays > 0 ? cycleValue / bundleDays : 0;

    return {
      berrySlug: berry.slug,
      routeKey: `${berry.slug}::self::${candidate.routeKey}`,
      methodKey: "self",
      methodLabel: "Self-sufficient",
      methodSubtitle: "Grow seeds first, then grow berries",
      shortName: berry.shortName,
      category: berry.category,
      effect: berry.effect,
      sprite: `../assets/img/berries/${berry.slug}.png`,
      sellPrice,
      vendorPrice: berry.vendorPrice,
      totalBerries,
      averageYield: berry.yieldPerPlot,
      yieldProfile: berry.yieldProfile,
      growthHours: berry.growthHours,
      standardDays: berryDays,
      bundleDays,
      totalPlots,
      recipe: berry.seedRecipe,
      recipeBreakdown: getRecipeBreakdown(berry.seedRecipe, totalPlots, priceState),
      seedSpend: 0,
      revenue,
      cycleValue,
      dailyValue,
      perCharacterDaily: dailyValue / totalCharacters,
      profitable: dailyValue > 0,
      isSelfSufficient: true,
      availability: "pure-only",
      pureLoop: true,
      sourceFlavor: flavor,
      seedPrep: {
        flavor,
        methodLabel: candidate.methodLabel,
        berrySlug: candidate.berrySlug,
        shortName: candidate.shortName,
        sprite: candidate.sprite,
        growthHours: candidate.growthHours,
        standardDays: candidate.standardDays,
        recipe: candidate.recipe,
        seedCycles,
        prepDays,
        prepToolCost,
        netPlain: candidate.netPlain,
        netVery: candidate.netVery,
        needPlain,
        needVery,
      },
    };
  });

  return routes.sort((left, right) => right.dailyValue - left.dailyValue)[0];
}

function getMethodRoutes(berry, totalPlots, totalCharacters, priceState, veryRate) {
  const routes = [createBuySeedsRoute(berry, totalPlots, totalCharacters, priceState)];
  const selfRoute = createSelfSufficientRoute(
    berry,
    totalPlots,
    totalCharacters,
    priceState,
    veryRate,
  );
  if (selfRoute) {
    routes.push(selfRoute);
  }
  return routes;
}

function buildGroup(berry, totalPlots, totalCharacters, priceState, veryRate) {
  const methods = getMethodRoutes(berry, totalPlots, totalCharacters, priceState, veryRate);
  const preferred = [...methods].sort((left, right) => right.dailyValue - left.dailyValue)[0];

  return {
    berrySlug: berry.slug,
    berry,
    methods,
    preferredMethodKey: preferred.methodKey,
    activeMethodKey: preferred.methodKey,
    activeRoute: preferred,
    hasVariants: methods.length > 1,
  };
}

function filterGroups(groups, filters) {
  return groups
    .map((group) => {
      const methodPool =
        filters.method === "all"
          ? group.methods
          : group.methods.filter((route) => route.methodKey === filters.method);

      if (methodPool.length === 0) {
        return null;
      }

      const activeRoute =
        methodPool.find((route) => route.methodKey === filters.activeMethods[group.berrySlug]) ??
        methodPool.find((route) => route.methodKey === group.preferredMethodKey) ??
        methodPool[0];

      if (filters.visibility === "profitable" && activeRoute.dailyValue <= 0) {
        return null;
      }

      if (
        filters.standardDays !== "all" &&
        activeRoute.standardDays !== Number(filters.standardDays)
      ) {
        return null;
      }

      if (filters.search) {
        const haystack = [
          group.berry.shortName,
          group.berry.category,
          group.berry.effect,
          ...methodPool.map((route) => route.methodLabel),
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(filters.search.toLowerCase())) {
          return null;
        }
      }

      return {
        ...group,
        methods: methodPool,
        activeMethodKey: activeRoute.methodKey,
        activeRoute,
      };
    })
    .filter(Boolean);
}

function sortGroups(groups, sortKey) {
  const sorted = [...groups];
  sorted.sort((left, right) => {
    const leftRoute = left.activeRoute;
    const rightRoute = right.activeRoute;

    switch (sortKey) {
      case "cycle-desc":
        return rightRoute.cycleValue - leftRoute.cycleValue;
      case "growth-asc":
        return (
          leftRoute.growthHours - rightRoute.growthHours ||
          leftRoute.shortName.localeCompare(rightRoute.shortName)
        );
      case "name-asc":
        return leftRoute.shortName.localeCompare(rightRoute.shortName);
      case "daily-desc":
      default:
        return rightRoute.dailyValue - leftRoute.dailyValue;
    }
  });
  return sorted;
}

export function getBerryRouteScenario(inputState = {}) {
  const state = {
    characters: clampNumber(inputState.characters, 1, 1, 9),
    visibility: inputState.visibility === "profitable" ? "profitable" : "all",
    method: ["all", "buy", "self"].includes(inputState.method) ? inputState.method : "all",
    standardDays: ["all", "1", "2", "3"].includes(String(inputState.standardDays ?? "all"))
      ? String(inputState.standardDays ?? "all")
      : "all",
    sort: ["daily-desc", "cycle-desc", "growth-asc", "name-asc"].includes(inputState.sort)
      ? inputState.sort
      : "daily-desc",
    search: String(inputState.search ?? "").trim(),
    activeMethods: inputState.activeMethods ?? {},
    veryRatePercent: clampNumber(inputState.veryRatePercent, DEFAULT_VERY_RATE_PERCENT, 0, 100),
  };

  const priceState = getPriceState();
  const totalPlots = state.characters * STANDARD_PLOTS_PER_CHARACTER;
  const veryRate = state.veryRatePercent / 100;
  const groups = BERRIES.map((berry) =>
    buildGroup(berry, totalPlots, state.characters, priceState, veryRate),
  );
  const filtered = filterGroups(groups, state);
  const visibleGroups = sortGroups(filtered, state.sort);
  const bestRoute = visibleGroups[0]?.activeRoute ?? null;
  const profitableCount = groups.filter((group) =>
    group.methods.some((route) => route.dailyValue > 0),
  ).length;
  const selfCount = groups.filter((group) =>
    group.methods.some((route) => route.methodKey === "self"),
  ).length;

  return {
    state: { ...state, totalPlots, veryRate },
    priceState,
    totalCount: groups.length,
    visibleGroups,
    bestRoute,
    profitableCount,
    selfCount,
  };
}
