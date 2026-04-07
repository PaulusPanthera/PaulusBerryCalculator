// assets/js/modules/seeds/logic.js
// v2.0.0-beta
// Standard-cycle seed route calculations grouped by flavor and normalized to daily value.
import { BERRIES } from "../catalog/data.js";
import { FLAVOR_META, FLAVOR_ORDER } from "../pricing/defaults.js";
import { getHarvestToolPrice, getPriceState, getSeedPrice } from "../pricing/store.js";
import { getHarvestOutputsByFlavor } from "../seed-harvest/logic.js";
import {
  DEFAULT_VERY_RATE_PERCENT,
  getGrowthBucketLabel,
  getOrientationLabel,
  getStandardDaysForGrowth,
  parseSeedToken,
  STANDARD_PLOTS_PER_CHARACTER,
} from "./data.js";

function clampNumber(value, fallback, min, max) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
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

function getValueBreakdown(netSeeds, priceState) {
  let sellValue = 0;
  let selfUseValue = 0;
  let buybackValue = 0;

  for (const flavor of FLAVOR_ORDER) {
    const plainSell = getSeedPrice(priceState, flavor, "plain", "sell");
    const plainBuy = getSeedPrice(priceState, flavor, "plain", "buy");
    const verySell = getSeedPrice(priceState, flavor, "very", "sell");
    const veryBuy = getSeedPrice(priceState, flavor, "very", "buy");
    const plainNet = netSeeds[flavor].plain;
    const veryNet = netSeeds[flavor].very;

    if (plainNet > 0) {
      sellValue += plainNet * plainSell;
      selfUseValue += plainNet * plainBuy;
    } else {
      buybackValue += Math.abs(plainNet) * plainBuy;
    }

    if (veryNet > 0) {
      sellValue += veryNet * verySell;
      selfUseValue += veryNet * veryBuy;
    } else {
      buybackValue += Math.abs(veryNet) * veryBuy;
    }
  }

  return { sellValue, selfUseValue, buybackValue };
}

function getRouteFamily(berry, selectedFlavorShare) {
  const days = getStandardDaysForGrowth(berry.growthHours);
  const dayLabel = getGrowthBucketLabel(days);
  const orientation = getOrientationLabel(selectedFlavorShare);

  return `${dayLabel} · ${orientation}`;
}

function getMethodLabel(method, recipeCounts, flavor, selectedShare) {
  const selected = recipeCounts[flavor];
  const pure = selectedShare >= 0.99;

  if (method.kind === "exact") {
    if (!pure) {
      return "Exact";
    }

    if (selected.plain === 0 && selected.very === 2) {
      return "Rebuy";
    }

    if (selected.very >= 1 && selected.plain >= 1) {
      return "Balanced";
    }

    return "Exact";
  }

  if (pure) {
    if (selected.plain === 3 && selected.very === 0) {
      return "Very focus";
    }

    if (selected.plain === 2 && selected.very === 1) {
      return "Balanced";
    }
  }

  return "Plain swap";
}

function getMethodOptions(berry) {
  const baseRecipe = berry.seedRecipe;
  const methods = [
    {
      key: "exact",
      kind: "exact",
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
        key: `swap-${token.flavor}`,
        kind: "plain-swap",
        recipe: replacement,
      });
    }
  });

  return [...methods, ...variants.values()];
}

function createSeedRoute(berry, flavor, state, priceState, method) {
  const recipeTokens = method.recipe.map(parseSeedToken);
  const totalPlots = state.totalPlots;
  const totalBerries = berry.yieldPerPlot * totalPlots;
  const {
    recipeCounts,
    profile,
    output: outputByFlavor,
  } = getHarvestOutputsByFlavor(totalBerries, recipeTokens, state.veryRate);
  const selectedShare = profile[flavor].share;

  if (selectedShare <= 0) {
    return null;
  }

  const netSeeds = getNetSeeds(outputByFlavor, recipeCounts, totalPlots);
  const { sellValue, selfUseValue, buybackValue } = getValueBreakdown(netSeeds, priceState);
  const harvestToolCost = totalBerries * getHarvestToolPrice(priceState);
  const valuationMode = state.valuation;
  const outputValue = valuationMode === "self-use" ? selfUseValue : sellValue;
  const cycleValue = outputValue - buybackValue - harvestToolCost;
  const standardDays = getStandardDaysForGrowth(berry.growthHours);
  const selectedFlavorNet = netSeeds[flavor];
  const selfSustain = buybackValue <= 0.001;
  const selectedFlavorTotal = selectedFlavorNet.plain + selectedFlavorNet.very;
  const shareBreakdown = FLAVOR_ORDER.filter(
    (currentFlavor) => profile[currentFlavor].share > 0,
  ).map((currentFlavor) => ({
    flavor: currentFlavor,
    share: profile[currentFlavor].share,
    label: `${FLAVOR_META[currentFlavor].label} ${Math.round(profile[currentFlavor].share * 100)}%`,
  }));

  return {
    slug: `${flavor}:${berry.slug}`,
    berrySlug: berry.slug,
    routeKey: `${flavor}:${berry.slug}:${method.key}`,
    shortName: berry.shortName,
    category: berry.category,
    effect: berry.effect,
    sprite: `../assets/img/berries/${berry.slug}.png`,
    growthHours: berry.growthHours,
    standardDays,
    family: getRouteFamily(berry, selectedShare),
    orientation: getOrientationLabel(selectedShare).toLowerCase(),
    orientationLabel: getOrientationLabel(selectedShare),
    targetFlavor: flavor,
    targetFlavorLabel: FLAVOR_META[flavor].label,
    shareLabel: `${Math.round(selectedShare * 100)}% ${FLAVOR_META[flavor].label}`,
    selectedFlavorShare: selectedShare,
    selectedFlavorNet,
    selectedFlavorTotal,
    recipe: method.recipe,
    methodKey: method.key,
    methodKind: method.kind,
    methodLabel: getMethodLabel(method, recipeCounts, flavor, selectedShare),
    totalBerries,
    averageYield: berry.yieldPerPlot,
    yieldProfile: berry.yieldProfile,
    valuationMode,
    outputValue,
    sellValue,
    selfUseValue,
    buybackValue,
    harvestToolCost,
    cycleValue,
    dailyValue: cycleValue / standardDays,
    selfSustain,
    netSeeds,
    shareBreakdown,
  };
}

function getRouteGroupsForFlavor(flavor, state, priceState, selections = {}) {
  const groups = [];

  for (const berry of BERRIES) {
    const routes = getMethodOptions(berry)
      .map((method) => createSeedRoute(berry, flavor, state, priceState, method))
      .filter(Boolean);

    if (routes.length === 0) {
      continue;
    }

    const defaultRoute = [...routes].sort((left, right) => right.dailyValue - left.dailyValue)[0];
    const selectedKey = selections[`${flavor}:${berry.slug}`];
    const activeRoute = routes.find((route) => route.methodKey === selectedKey) ?? defaultRoute;

    groups.push({
      slug: berry.slug,
      shortName: berry.shortName,
      routes,
      activeRoute,
      hasVariants: routes.length > 1,
    });
  }

  return groups;
}

function compareRoutes(leftRoute, rightRoute, sort) {
  if (sort === "selected-desc") {
    return rightRoute.selectedFlavorTotal - leftRoute.selectedFlavorTotal;
  }

  if (sort === "growth-asc") {
    return (
      leftRoute.growthHours - rightRoute.growthHours || rightRoute.dailyValue - leftRoute.dailyValue
    );
  }

  if (sort === "cycle-desc") {
    return rightRoute.cycleValue - leftRoute.cycleValue;
  }

  return rightRoute.dailyValue - leftRoute.dailyValue;
}

function sortRoutes(routes, sort) {
  return [...routes].sort(
    (leftRoute, rightRoute) =>
      compareRoutes(leftRoute, rightRoute, sort) ||
      leftRoute.targetFlavorLabel.localeCompare(rightRoute.targetFlavorLabel),
  );
}

function getRepresentativeMethodOptions(flavorGroups) {
  const methodMap = new Map();

  for (const flavorGroup of flavorGroups) {
    for (const route of flavorGroup.routes) {
      if (!methodMap.has(route.methodKey)) {
        methodMap.set(route.methodKey, {
          methodKey: route.methodKey,
          methodLabel: route.methodLabel,
        });
      }
    }
  }

  return [...methodMap.values()];
}

function getRouteGroupsForAllFlavors(state, priceState, selections = {}) {
  const groups = [];

  for (const berry of BERRIES) {
    const flavorGroups = FLAVOR_ORDER.map((flavor) => {
      const routes = getMethodOptions(berry)
        .map((method) => createSeedRoute(berry, flavor, state, priceState, method))
        .filter(Boolean);

      if (routes.length === 0) {
        return null;
      }

      return {
        flavor,
        routes,
        defaultRoute: sortRoutes(routes, "daily-desc")[0],
      };
    }).filter(Boolean);

    if (flavorGroups.length === 0) {
      continue;
    }

    const methodOptions = getRepresentativeMethodOptions(flavorGroups);
    const defaultMethodKey = sortRoutes(
      flavorGroups.flatMap((entry) => entry.routes),
      "daily-desc",
    )[0]?.methodKey;
    const selectedMethodKey = selections[`all:${berry.slug}`] || defaultMethodKey;
    const allFlavorRoutes = sortRoutes(
      flavorGroups.map((entry) => {
        return (
          entry.routes.find((route) => route.methodKey === selectedMethodKey) ??
          entry.routes.find((route) => route.methodKey === defaultMethodKey) ??
          entry.defaultRoute
        );
      }),
      state.sort,
    );
    const bestDailyRoute = sortRoutes(allFlavorRoutes, "daily-desc")[0];

    groups.push({
      slug: berry.slug,
      shortName: berry.shortName,
      routes: methodOptions,
      allFlavorRoutes,
      activeRoute: allFlavorRoutes[0],
      bestDailyRoute,
      hasVariants: methodOptions.length > 1,
    });
  }

  return groups;
}

function sortGroups(groups, sort) {
  const sorted = [...groups];

  sorted.sort((left, right) => compareRoutes(left.activeRoute, right.activeRoute, sort));

  return sorted;
}

function routeMatchesState(route, state) {
  if (state.visibility === "profitable" && route.dailyValue <= 0) {
    return false;
  }

  if (state.visibility === "sustain" && !route.selfSustain) {
    return false;
  }

  if (state.orientation !== "all" && route.orientation !== state.orientation) {
    return false;
  }

  if (state.dayBucket !== "all" && String(route.standardDays) !== state.dayBucket) {
    return false;
  }

  return true;
}

function filterGroups(groups, state) {
  return groups.filter((group) => {
    const routes = group.allFlavorRoutes || [group.activeRoute];

    return routes.some((route) => routeMatchesState(route, state));
  });
}

export function getSeedStateFromInputs(values) {
  const flavor =
    values.flavor === "all" || FLAVOR_ORDER.includes(values.flavor) ? values.flavor : "all";
  const characters = clampNumber(values.characters, 1, 1, 9);
  const veryRatePercent = clampNumber(values.veryRatePercent, DEFAULT_VERY_RATE_PERCENT, 0, 100);

  return {
    flavor,
    characters,
    plotsPerCharacter: STANDARD_PLOTS_PER_CHARACTER,
    totalPlots: characters * STANDARD_PLOTS_PER_CHARACTER,
    veryRatePercent,
    veryRate: veryRatePercent / 100,
    valuation: values.valuation === "self-use" ? "self-use" : "sell",
    sort: values.sort || "daily-desc",
    visibility: values.visibility || "all",
    orientation: values.orientation || "all",
    dayBucket: values.dayBucket || "all",
  };
}

export function getSeedScenario(state, selections = {}) {
  const priceState = getPriceState();
  const allGroups =
    state.flavor === "all"
      ? getRouteGroupsForAllFlavors(state, priceState, selections)
      : getRouteGroupsForFlavor(state.flavor, state, priceState, selections);
  const filteredGroups = sortGroups(filterGroups(allGroups, state), state.sort);
  const allRoutes = allGroups.flatMap((group) => group.allFlavorRoutes || [group.activeRoute]);
  const bestRoute = sortRoutes(allRoutes, "daily-desc")[0] ?? null;
  const profitableCount = allGroups.filter((group) =>
    (group.allFlavorRoutes || [group.activeRoute]).some((route) => route.dailyValue > 0),
  ).length;
  const selfSustainCount = allGroups.filter((group) =>
    (group.allFlavorRoutes || [group.activeRoute]).some((route) => route.selfSustain),
  ).length;

  return {
    state,
    priceState,
    groups: filteredGroups,
    allGroups,
    bestRoute,
    profitableCount,
    selfSustainCount,
  };
}
