// assets/js/modules/shop/render.js
// v2.0.0-beta
// Rendering helpers for Shop sections, shared pricing inputs, and auto-price sync status.
import { escapeHTML, formatMoney } from "../format.js";
import { AUTO_SOURCE_PRESETS, FLAVOR_META, FLAVOR_ORDER } from "../pricing/defaults.js";

function renderAutoValueLine(mode, values) {
  if (mode !== "auto" || !values || (values.buy <= 0 && values.sell <= 0)) {
    return "";
  }

  return `<p class="shop-inline-note">Auto · listed ${escapeHTML(formatMoney(values.buy))} · net ${escapeHTML(formatMoney(values.sell))}</p>`;
}

function renderPowderAutoSellLine(mode, value) {
  if (mode !== "auto" || !(Number(value) > 0)) {
    return "";
  }

  return `<p class="shop-inline-note">Auto · net ${escapeHTML(formatMoney(value))}</p>`;
}

function renderPowderAutoBuyLine(mode, value) {
  if (mode !== "auto" || !(Number(value) > 0)) {
    return "";
  }

  return `<p class="shop-inline-note">Auto · listed ${escapeHTML(formatMoney(value))}</p>`;
}

function getBerryModeLabel(mode) {
  if (mode === "manual") {
    return "Manual berries";
  }

  if (mode === "auto") {
    return "Auto berries";
  }

  return "Vendor berries";
}

function getPowderModeLabel(mode, type) {
  if (type === "berry") {
    return getBerryModeLabel(mode);
  }

  return mode === "auto" ? "Auto" : "Manual";
}

export function renderSeedPriceCards(target, priceState) {
  target.innerHTML = FLAVOR_ORDER.map((flavor) => {
    const meta = FLAVOR_META[flavor];
    const prices = priceState.seeds.manual[flavor];
    const autoPrices = priceState.seeds.auto[flavor];

    return `
      <article class="shop-card">
        <div class="shop-card__head">
          <div>
            <p class="eyebrow">Seed pair</p>
            <h3>${escapeHTML(meta.label)}</h3>
          </div>
          <img class="shop-card__icon" src="${escapeHTML(meta.plainIcon)}" alt="">
        </div>

        <div class="shop-card__grid shop-card__grid--dual-prices">
          <label class="field" for="seed-${flavor}-plain-sell">
            <span>${escapeHTML(meta.plainLabel)} · Sell</span>
            <input id="seed-${flavor}-plain-sell" data-seed-flavor="${flavor}" data-seed-type="plain" data-price-side="sell" type="number" min="0" step="10" value="${escapeHTML(String(prices.plain.sell))}">
            ${renderAutoValueLine(priceState.seeds.mode, autoPrices.plain)}
          </label>
          <label class="field" for="seed-${flavor}-plain-buy">
            <span>${escapeHTML(meta.plainLabel)} · Buy</span>
            <input id="seed-${flavor}-plain-buy" data-seed-flavor="${flavor}" data-seed-type="plain" data-price-side="buy" type="number" min="0" step="10" value="${escapeHTML(String(prices.plain.buy))}">
          </label>
          <label class="field" for="seed-${flavor}-very-sell">
            <span>${escapeHTML(meta.veryLabel)} · Sell</span>
            <input id="seed-${flavor}-very-sell" data-seed-flavor="${flavor}" data-seed-type="very" data-price-side="sell" type="number" min="0" step="10" value="${escapeHTML(String(prices.very.sell))}">
            ${renderAutoValueLine(priceState.seeds.mode, autoPrices.very)}
          </label>
          <label class="field" for="seed-${flavor}-very-buy">
            <span>${escapeHTML(meta.veryLabel)} · Buy</span>
            <input id="seed-${flavor}-very-buy" data-seed-flavor="${flavor}" data-seed-type="very" data-price-side="buy" type="number" min="0" step="10" value="${escapeHTML(String(prices.very.buy))}">
          </label>
        </div>
      </article>
    `;
  }).join("");
}

export function renderBerryPriceRows(target, berries, priceState, query = "") {
  const filtered = berries.filter((berry) => {
    if (!query) {
      return true;
    }
    const haystack = `${berry.shortName} ${berry.category} ${berry.effect}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  target.innerHTML = filtered
    .map((berry) => {
      const manualValue = priceState.berries.manual?.[berry.slug] ?? { sell: "", buy: "" };
      const autoValue = priceState.berries.auto?.[berry.slug] ?? { sell: 0, buy: 0 };

      return `
      <div class="shop-row shop-row--dual-prices">
        <div class="shop-row__berry">
          <img class="shop-row__sprite" src="../assets/img/berries/${escapeHTML(berry.slug)}.png" alt="${escapeHTML(berry.shortName)} berry sprite">
          <div>
            <strong>${escapeHTML(berry.shortName)}</strong>
            <span>${escapeHTML(formatMoney(berry.vendorPrice))} vendor</span>
            ${renderAutoValueLine(priceState.berries.mode, autoValue)}
          </div>
        </div>

        <label class="field shop-row__input" for="berry-sell-${escapeHTML(berry.slug)}">
          <span>Sell</span>
          <input id="berry-sell-${escapeHTML(berry.slug)}" data-berry-slug="${escapeHTML(berry.slug)}" data-price-side="sell" type="number" min="0" step="10" placeholder="${escapeHTML(String(berry.vendorPrice))}" value="${escapeHTML(String(manualValue.sell ?? ""))}">
        </label>

        <label class="field shop-row__input" for="berry-buy-${escapeHTML(berry.slug)}">
          <span>Buy</span>
          <input id="berry-buy-${escapeHTML(berry.slug)}" data-berry-slug="${escapeHTML(berry.slug)}" data-price-side="buy" type="number" min="0" step="10" placeholder="${escapeHTML(String(berry.vendorPrice))}" value="${escapeHTML(String(manualValue.buy ?? ""))}">
        </label>
      </div>
    `;
    })
    .join("");
}

export function renderShopHeroSummary(target, priceState) {
  const seedMode = priceState.seeds.mode === "manual" ? "Manual seeds" : "Auto seeds";
  const berryMode = getBerryModeLabel(priceState.berries.mode);
  const powderTargetMode =
    priceState.powder?.targetMode === "auto" ? "Auto powder sells" : "Manual powder sells";
  const powderBerryMode = `Powder berries · ${getPowderModeLabel(priceState.powder?.berryMode, "berry").replace(" berries", "")}`;
  const autoMeta = priceState.autoPricing;
  const syncLabel = autoMeta.lastSyncAt
    ? `Sync · ${new Date(autoMeta.lastSyncAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}`
    : "Sync · not yet";

  target.innerHTML = `
    <span class="hero-pill">${escapeHTML(seedMode)}</span>
    <span class="hero-pill">${escapeHTML(berryMode)}</span>
    <span class="hero-pill">${escapeHTML(powderTargetMode)}</span>
    <span class="hero-pill">${escapeHTML(powderBerryMode)}</span>
    <span class="hero-pill">Harvest Tool · 350</span>
    <span class="hero-pill">${escapeHTML(syncLabel)}</span>
  `;
}

export function renderAutoSyncSummary(target, priceState) {
  const meta = priceState.autoPricing;
  const sourceLabel = AUTO_SOURCE_PRESETS[meta.source]?.label || "Custom endpoint";
  const statusLabel =
    meta.lastStatus === "success"
      ? `${meta.matchedSeeds} seeds · ${meta.matchedBerries} berries · ${meta.matchedPowderTargets || 0} powder targets · ${meta.matchedPowderIngredients || 0} powder ingredients`
      : meta.lastStatus === "error"
        ? meta.lastError || "Sync failed"
        : "No sync yet";

  target.innerHTML = `
    <span class="hero-pill">Source · ${escapeHTML(sourceLabel)}</span>
    <span class="hero-pill">Listed = buy</span>
    <span class="hero-pill">Sell = listed − fee</span>
    <span class="hero-pill">${escapeHTML(statusLabel)}</span>
  `;
}

export function renderPowderSectionNotes(targetsNode, ingredientsNode, berryNode, priceState) {
  const meta = priceState.autoPricing;
  const targetMode = getPowderModeLabel(priceState.powder?.targetMode, "target");
  const ingredientMode = getPowderModeLabel(priceState.powder?.ingredientMode, "ingredient");
  const berryMode = getPowderModeLabel(priceState.powder?.berryMode, "berry");

  if (targetsNode) {
    targetsNode.textContent =
      meta.lastStatus === "success"
        ? `${targetMode} source active. Last sync matched ${meta.matchedPowderTargets || 0} powder craft targets.`
        : `${targetMode} source active. Auto sync stores net sell snapshots here when listings are matched.`;
  }

  if (ingredientsNode) {
    ingredientsNode.textContent =
      meta.lastStatus === "success"
        ? `${ingredientMode} source active. Last sync matched ${meta.matchedPowderIngredients || 0} powder extras.`
        : `${ingredientMode} source active. These are the non-berry extras. Auto stores listed buy snapshots when available.`;
  }

  if (berryNode) {
    berryNode.textContent = `${berryMode} source active. Lum and Leppa use this dedicated berry-buy mode for powder crafting.`;
  }
}

const POWDER_TARGET_ROWS = [
  ["ppMax", "PP Max"],
  ["maxRevive", "Max Revive"],
  ["maxPotion", "Max Potion"],
  ["fullRestore", "Full Restore"],
  ["fullHeal", "Full Heal"],
  ["maxElixir", "Max Elixir"],
  ["maxEther", "Max Ether"],
  ["hyperHpUp", "Hyper HP Up"],
  ["hyperProtein", "Hyper Protein"],
  ["hyperIron", "Hyper Iron"],
  ["hyperCalcium", "Hyper Calcium"],
  ["hyperZinc", "Hyper Zinc"],
  ["hyperCarbos", "Hyper Carbos"],
  ["hpUp", "HP Up"],
  ["protein", "Protein"],
  ["iron", "Iron"],
  ["calcium", "Calcium"],
  ["zinc", "Zinc"],
  ["carbos", "Carbos"],
];

const POWDER_INGREDIENT_ROWS = [
  ["whiteHerb", "White Herb"],
  ["revivalHerb", "Revival Herb"],
  ["energyRoot", "Energy Root"],
  ["evWing", "EV Wing"],
];

const POWDER_BERRY_ROWS = [
  ["lum", "Lum Berry"],
  ["leppa", "Leppa Berry"],
];

export function renderPowderTargetRows(target, priceState) {
  target.innerHTML = POWDER_TARGET_ROWS.map(([key, label]) => {
    const autoValue = priceState.powder?.autoTargets?.[key] ?? 0;

    return `
      <div class="shop-row shop-row--single-price">
        <div class="shop-row__berry">
          <div>
            <strong>${escapeHTML(label)}</strong>
            <span>Sell price</span>
            ${renderPowderAutoSellLine(priceState.powder?.targetMode, autoValue)}
          </div>
        </div>
        <label class="field shop-row__input" for="powder-target-${escapeHTML(key)}">
          <span>Sell</span>
          <input id="powder-target-${escapeHTML(key)}" data-powder-target="${escapeHTML(key)}" type="number" min="0" step="10" value="${escapeHTML(String(priceState.powder.targets[key] ?? 0))}">
        </label>
      </div>
    `;
  }).join("");
}

export function renderPowderIngredientCards(target, priceState) {
  target.innerHTML = POWDER_INGREDIENT_ROWS.map(([key, label]) => {
    const autoValue = priceState.powder?.autoIngredients?.[key] ?? 0;

    return `
      <article class="shop-card">
        <div class="shop-card__head">
          <div>
            <p class="eyebrow">Powder extra</p>
            <h3>${escapeHTML(label)}</h3>
            ${renderPowderAutoBuyLine(priceState.powder?.ingredientMode, autoValue)}
          </div>
        </div>
        <div class="shop-card__grid">
          <label class="field" for="powder-ingredient-${escapeHTML(key)}">
            <span>Buy</span>
            <input id="powder-ingredient-${escapeHTML(key)}" data-powder-ingredient="${escapeHTML(key)}" type="number" min="0" step="10" value="${escapeHTML(String(priceState.powder.ingredients[key] ?? 0))}">
          </label>
        </div>
      </article>
    `;
  }).join("");
}

export function renderPowderBerryRows(target, berries, priceState) {
  target.innerHTML = POWDER_BERRY_ROWS.map(([slug, label]) => {
    const berry = berries.find((entry) => entry.slug === slug);
    const manualValue = priceState.berries.manual?.[slug] ?? { sell: "", buy: "" };
    const autoValue = priceState.berries.auto?.[slug] ?? { sell: 0, buy: 0 };
    const placeholder = berry ? String(berry.vendorPrice) : "0";

    return `
      <div class="shop-row shop-row--single-price">
        <div class="shop-row__berry">
          ${berry ? `<img class="shop-row__sprite" src="../assets/img/berries/${escapeHTML(slug)}.png" alt="${escapeHTML(label)} sprite">` : ""}
          <div>
            <strong>${escapeHTML(label)}</strong>
            <span>Uses berry buy price</span>
            ${renderAutoValueLine(priceState.powder?.berryMode, autoValue)}
          </div>
        </div>
        <label class="field shop-row__input" for="powder-berry-buy-${escapeHTML(slug)}">
          <span>Buy</span>
          <input id="powder-berry-buy-${escapeHTML(slug)}" data-powder-berry="${escapeHTML(slug)}" type="number" min="0" step="10" placeholder="${escapeHTML(placeholder)}" value="${escapeHTML(String(manualValue.buy ?? ""))}">
        </label>
      </div>
    `;
  }).join("");
}
