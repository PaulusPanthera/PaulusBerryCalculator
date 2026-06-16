// assets/js/modules/pricing/store.js
// v2.0.0-beta
// Local price storage and helpers for Shop, route tabs, and powder crafting.
import {
  AUTO_SOURCE_PRESETS,
  DEFAULT_PRICE_STATE,
  EV_BERRY_SEED_PACKET_SIZE,
  FLAVOR_ORDER,
  LEPPA_SEED_PACKET_SIZE,
} from "./defaults.js";
import { normalizeRhythmMode } from "../settings/rhythm.js";

const PRICE_STORAGE_KEY = "paulus-berry-calculator-price-state-v1";

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_PRICE_STATE));
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function mergeDeep(base, incoming) {
  const output = Array.isArray(base) ? [...base] : { ...base };

  if (!isObject(incoming)) {
    return output;
  }

  for (const [key, value] of Object.entries(incoming)) {
    const current = output[key];

    if (isObject(current) && isObject(value)) {
      output[key] = mergeDeep(current, value);
    } else {
      output[key] = value;
    }
  }

  return output;
}

function normalizeMode(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function normalizePacket(input = {}, seedsPerPacket) {
  return {
    enabled: input.enabled === true,
    price: Number(input.price) || 0,
    seedsPerPacket,
  };
}

function normalizeLeppaPacket(input = {}) {
  return normalizePacket(input, LEPPA_SEED_PACKET_SIZE);
}

function normalizeEvBerryPacket(input = {}) {
  return normalizePacket(input, EV_BERRY_SEED_PACKET_SIZE);
}

function normalizePowderNumberMap(input) {
  const output = {};

  for (const [key, value] of Object.entries(input || {})) {
    output[key] = Number(value) || 0;
  }

  return output;
}

function normalizePriceState(state) {
  const normalized = cloneDefaultState();
  const merged = mergeDeep(normalized, state);

  merged.seeds.mode = merged.seeds.mode === "auto" ? "auto" : "manual";
  merged.berries.mode = normalizeMode(merged.berries.mode, ["vendor", "manual", "auto"], "vendor");
  merged.assumptions ||= {};
  merged.assumptions.rhythmMode = normalizeRhythmMode(merged.assumptions.rhythmMode);
  merged.packets ||= {};
  merged.packets.leppa = normalizeLeppaPacket(merged.packets.leppa);
  merged.packets.evBerry = normalizeEvBerryPacket(merged.packets.evBerry);

  for (const flavor of FLAVOR_ORDER) {
    const flavorEntry = merged.seeds.manual[flavor];

    for (const type of ["plain", "very"]) {
      const current = flavorEntry[type];

      if (typeof current === "number") {
        flavorEntry[type] = { sell: current, buy: current };
      } else {
        flavorEntry[type] = {
          sell: Number(current?.sell) || 0,
          buy: Number(current?.buy) || Number(current?.sell) || 0,
        };
      }
    }
  }

  const berryManual = {};

  for (const [slug, value] of Object.entries(merged.berries.manual || {})) {
    if (typeof value === "number") {
      berryManual[slug] = { sell: value, buy: value };
    } else {
      berryManual[slug] = {
        sell: Number(value?.sell) || 0,
        buy: Number(value?.buy) || Number(value?.sell) || 0,
      };
    }
  }

  merged.berries.manual = berryManual;
  merged.tools.harvestTool.vendor = Number(merged.tools.harvestTool.vendor) || 0;
  merged.tools.harvestTool.manual = Number(merged.tools.harvestTool.manual) || 0;

  merged.powder ||= {};
  merged.powder.targetMode = normalizeMode(merged.powder.targetMode, ["manual", "auto"], "manual");
  merged.powder.ingredientMode = normalizeMode(
    merged.powder.ingredientMode,
    ["manual", "auto"],
    "manual",
  );
  merged.powder.berryMode = normalizeMode(
    merged.powder.berryMode,
    ["vendor", "manual", "auto"],
    "vendor",
  );
  merged.powder.targets = normalizePowderNumberMap(merged.powder.targets);
  merged.powder.ingredients = normalizePowderNumberMap(merged.powder.ingredients);
  merged.powder.autoTargets = normalizePowderNumberMap(merged.powder.autoTargets);
  merged.powder.autoIngredients = normalizePowderNumberMap(merged.powder.autoIngredients);

  return merged;
}

export function getPriceState() {
  try {
    const raw = localStorage.getItem(PRICE_STORAGE_KEY);

    if (!raw) {
      return cloneDefaultState();
    }

    return normalizePriceState(JSON.parse(raw));
  } catch {
    return cloneDefaultState();
  }
}

export function savePriceState(state) {
  localStorage.setItem(PRICE_STORAGE_KEY, JSON.stringify(normalizePriceState(state)));
}

export function resetPriceState() {
  const defaults = cloneDefaultState();

  savePriceState(defaults);

  return defaults;
}

export function getSeedPrice(priceState, flavor, type, side = "sell") {
  const safeFlavor = FLAVOR_ORDER.includes(flavor) ? flavor : "sweet";
  const safeType = type === "very" ? "very" : "plain";
  const safeSide = side === "buy" ? "buy" : "sell";
  const mode = priceState?.seeds?.mode === "auto" ? "auto" : "manual";
  const modeEntry = priceState?.seeds?.[mode]?.[safeFlavor]?.[safeType];
  const fallbackEntry = priceState?.seeds?.manual?.[safeFlavor]?.[safeType];

  return Number(modeEntry?.[safeSide]) || Number(fallbackEntry?.[safeSide]) || 0;
}

export function getHarvestToolPrice() {
  return 350;
}

function getSeedPacketQuote(packet, plantings, seedsPerPacket) {
  const safePlantings = Number(plantings) || 0;

  if (!packet.enabled || !(packet.price > 0) || !(safePlantings > 0)) {
    return {
      enabled: false,
      price: packet.price,
      seedsPerPacket,
      packets: 0,
      value: 0,
      unitPlantingCost: 0,
    };
  }

  const packets = safePlantings / seedsPerPacket;
  const value = packets * packet.price;

  return {
    enabled: true,
    price: packet.price,
    seedsPerPacket,
    packets,
    value,
    unitPlantingCost: packet.price / seedsPerPacket,
  };
}

export function getLeppaSeedPacketQuote(priceState, plantings = LEPPA_SEED_PACKET_SIZE) {
  return getSeedPacketQuote(
    normalizeLeppaPacket(priceState?.packets?.leppa),
    plantings,
    LEPPA_SEED_PACKET_SIZE,
  );
}

export function getEvBerrySeedPacketQuote(priceState, plantings = EV_BERRY_SEED_PACKET_SIZE) {
  return getSeedPacketQuote(
    normalizeEvBerryPacket(priceState?.packets?.evBerry),
    plantings,
    EV_BERRY_SEED_PACKET_SIZE,
  );
}

export function getBerryPriceByMode(priceState, berry, mode = "vendor", side = "sell") {
  const safeSide = side === "buy" ? "buy" : "sell";
  const safeMode = normalizeMode(mode, ["vendor", "manual", "auto"], "vendor");

  if (safeMode === "auto") {
    const autoValue = Number(priceState?.berries?.auto?.[berry.slug]?.[safeSide]);

    if (autoValue > 0) {
      return autoValue;
    }
  }

  if (safeMode === "manual" || safeMode === "auto") {
    const manualValue = Number(priceState?.berries?.manual?.[berry.slug]?.[safeSide]);

    if (manualValue > 0) {
      return manualValue;
    }
  }

  return Number(berry.vendorPrice) || 0;
}

export function getBerryPrice(priceState, berry, side = "sell") {
  return getBerryPriceByMode(priceState, berry, priceState?.berries?.mode || "vendor", side);
}

export function getBerryToolingBuyQuote(priceState, berry) {
  const mode = normalizeMode(
    priceState?.berries?.mode || "vendor",
    ["vendor", "manual", "auto"],
    "vendor",
  );
  const manualValue = Number(priceState?.berries?.manual?.[berry.slug]?.buy) || 0;
  const autoValue = Number(priceState?.berries?.auto?.[berry.slug]?.buy) || 0;

  if (mode === "auto" && autoValue > 0) {
    return { price: autoValue, hasPrice: true, source: "auto" };
  }

  if ((mode === "manual" || mode === "auto") && manualValue > 0) {
    return { price: manualValue, hasPrice: true, source: "manual" };
  }

  return { price: null, hasPrice: false, source: mode === "vendor" ? "vendor" : "missing" };
}

export function getPowderBerryBuyPrice(priceState, berry) {
  return getBerryPriceByMode(priceState, berry, priceState?.powder?.berryMode || "vendor", "buy");
}

export function getSeedPriceSummary(priceState, flavor) {
  return {
    plainSell: getSeedPrice(priceState, flavor, "plain", "sell"),
    plainBuy: getSeedPrice(priceState, flavor, "plain", "buy"),
    verySell: getSeedPrice(priceState, flavor, "very", "sell"),
    veryBuy: getSeedPrice(priceState, flavor, "very", "buy"),
  };
}

export function isAutoMode(mode) {
  return mode === "auto";
}

export function getAutoEndpoint(priceState) {
  const source = priceState?.autoPricing?.source || "fiereu";

  if (source === "custom") {
    return String(priceState?.autoPricing?.customEndpoint || "").trim();
  }

  return AUTO_SOURCE_PRESETS[source]?.endpoint || AUTO_SOURCE_PRESETS.fiereu.endpoint;
}

export { PRICE_STORAGE_KEY };

export function getPowderTargetPrice(priceState, key) {
  const mode = priceState?.powder?.targetMode === "auto" ? "auto" : "manual";
  const autoValue = Number(priceState?.powder?.autoTargets?.[key]) || 0;
  const manualValue = Number(priceState?.powder?.targets?.[key]) || 0;

  return mode === "auto" ? autoValue || manualValue || 0 : manualValue || autoValue || 0;
}

export function getPowderIngredientPrice(priceState, key) {
  const mode = priceState?.powder?.ingredientMode === "auto" ? "auto" : "manual";
  const autoValue = Number(priceState?.powder?.autoIngredients?.[key]) || 0;
  const manualValue = Number(priceState?.powder?.ingredients?.[key]) || 0;

  return mode === "auto" ? autoValue || manualValue || 0 : manualValue || autoValue || 0;
}
