// assets/js/modules/seeds/data.js
// v2.0.0-beta
// Flavor metadata and standard-cycle helpers for the Seed Routes page.
import { FLAVOR_META, FLAVOR_ORDER } from "../pricing/defaults.js";

export const FLAVOR_TABS = [
  {
    value: "all",
    label: "All flavors",
    plainIcon: null,
    veryIcon: null,
  },
  ...FLAVOR_ORDER.map((flavor) => ({
    value: flavor,
    label: FLAVOR_META[flavor].label,
    plainLabel: FLAVOR_META[flavor].plainLabel,
    veryLabel: FLAVOR_META[flavor].veryLabel,
    plainIcon: FLAVOR_META[flavor].plainIcon,
    veryIcon: FLAVOR_META[flavor].veryIcon,
  })),
];

export const STANDARD_PLOTS_PER_CHARACTER = 156;
export const DEFAULT_VERY_RATE_PERCENT = 30;

export function getStandardDaysForGrowth(growthHours) {
  if (growthHours <= 20) {
    return 1;
  }

  if (growthHours <= 44) {
    return 2;
  }

  return 3;
}

export function getOrientationLabel(share) {
  if (share >= 0.99) {
    return "Pure";
  }

  if (share >= 0.66) {
    return "Split";
  }

  return "Side";
}

export function getGrowthBucketLabel(days) {
  if (days === 1) {
    return "1 day";
  }

  if (days === 2) {
    return "2 day";
  }

  return "3 day";
}

export function parseSeedToken(token) {
  const [type, flavor] = token.toLowerCase().split(" ");

  return { type, flavor };
}
