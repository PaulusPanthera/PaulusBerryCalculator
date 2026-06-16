// assets/js/modules/leppa/data.js
// v2.0.0-beta
// Clean Leppa planner route definitions for normalized buy and self-sufficient baselines.

export const DEFAULT_LEPPA_CHARACTERS = 1;
export const LEPPA_PLOTS_PER_CHARACTER = 156;
export const LEPPA_DEFAULT_VERY_RATE = 0.3;

export const LEPPA_ROUTE_DEFINITIONS = [
  {
    id: "seed-buy-normalized",
    label: "Seed buy baseline",
    shortLabel: "Buy seeds",
    family: "buy",
    familyLabel: "Seed buy",
    strategy: "buy",
    summary: "Buy Very Spicy, Plain Bitter, and Plain Sweet, then plant Leppa directly.",
    assumptionNote:
      "Clean benchmark for purchased inputs. Profit is Leppa sale value minus the current Shop buy price of one Leppa seed packet.",
  },
  {
    id: "self-rawst-pecha-normalized",
    label: "Self-sufficient Rawst/Pecha",
    shortLabel: "Rawst/Pecha",
    family: "self",
    familyLabel: "Self-sufficient",
    strategy: "support",
    supportSystem: "rawst-pecha",
    summary:
      "Cheri makes Very Spicy. Rawst and Pecha make the Plain Bitter and Plain Sweet support.",
    assumptionNote:
      "Normalized-day baseline. Cheri uses the 3 plain method for Very Spicy production; Rawst and Pecha use their exact Plain + Very recipes.",
  },
  {
    id: "self-starf-normalized",
    label: "Self-sufficient Starf",
    shortLabel: "Starf",
    family: "starf",
    familyLabel: "Starf support",
    strategy: "support",
    supportSystem: "starf",
    summary:
      "Cheri makes Very Spicy. Starf supplies Plain Bitter and Plain Sweet over its 3-day block.",
    assumptionNote:
      "Normalized-day Starf baseline. This is the clean math view, not the later human pipeline/rhythm planner.",
  },
];
