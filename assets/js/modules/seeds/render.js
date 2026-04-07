// assets/js/modules/seeds/render.js
// v2.0.0-beta
// Rendering helpers for the flavor-first Seed Routes page.
import {
  escapeHTML,
  formatHours,
  formatMoney,
  formatNumber,
  formatSignedMoney,
  formatSignedNumber,
  formatYield,
  formatYieldProfile,
} from "../format.js";
import { FLAVOR_META } from "../pricing/defaults.js";
import { getSeedPriceSummary } from "../pricing/store.js";

function renderRecipeChip(token, activeFlavor) {
  const [type, flavor] = token.toLowerCase().split(" ");
  const meta = FLAVOR_META[flavor];
  const icon = type === "very" ? meta.veryIcon : meta.plainIcon;

  return `
    <span class="seed-chip ${flavor === activeFlavor ? "is-active" : ""}">
      <img src="${escapeHTML(icon)}" alt="">
      <span>${escapeHTML(token)}</span>
    </span>
  `;
}

function renderMethodSwitch(group) {
  if (!group.hasVariants) {
    return "";
  }

  return `
    <div class="seed-method-switch" aria-label="Method selector">
      ${group.routes
        .map(
          (route) => `
        <button
          class="seed-method-chip ${route.methodKey === group.activeRoute.methodKey ? "is-active" : ""}"
          type="button"
          data-route-method="${escapeHTML(route.methodKey)}"
          data-route-slug="${escapeHTML(group.slug)}"
        >
          ${escapeHTML(route.methodLabel)}
        </button>
      `,
        )
        .join("")}
    </div>
  `;
}

function renderShareChips(route) {
  return route.shareBreakdown
    .map((entry) => {
      const meta = FLAVOR_META[entry.flavor];

      return `
        <span class="seed-badge seed-badge--share">
          <img class="seed-icon" src="${escapeHTML(meta.plainIcon)}" alt="">
          <span>${escapeHTML(entry.label)}</span>
        </span>
      `;
    })
    .join("");
}

function renderPreviewStat(label, value, tone = "default") {
  return `
    <div class="seed-preview-stat ${tone !== "default" ? `is-${tone}` : ""}">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(value)}</strong>
    </div>
  `;
}

function renderFlavorLane(route, labels) {
  const meta = FLAVOR_META[route.targetFlavor];
  const dailyTone = route.dailyValue < 0 ? "is-negative" : "";

  return `
    <div class="seed-route-lane">
      <div class="seed-route-lane__top">
        <span class="seed-badge seed-badge--share">
          <img class="seed-icon" src="${escapeHTML(meta.plainIcon)}" alt="">
          <span>${escapeHTML(route.shareLabel)}</span>
        </span>
        <strong class="seed-route-lane__daily ${dailyTone}">${escapeHTML(formatSignedMoney(Math.round(route.dailyValue)))}</strong>
      </div>
      <div class="seed-route-lane__stats">
        <span>Net ${escapeHTML(formatSignedNumber(Math.round(route.selectedFlavorTotal)))}</span>
        <span>${escapeHTML(labels.cycleLabel)} ${escapeHTML(formatSignedMoney(Math.round(route.cycleValue)))}</span>
        <span>${route.selfSustain ? "Self-sustain" : `${escapeHTML(labels.negativeLabel)} ${escapeHTML(formatMoney(Math.round(route.buybackValue)))}`}</span>
      </div>
    </div>
  `;
}

function renderFlavorLine(flavor, type, value) {
  const meta = FLAVOR_META[flavor];
  const icon = type === "very" ? meta.veryIcon : meta.plainIcon;
  const label = type === "very" ? meta.veryLabel : meta.plainLabel;
  const toneClass = value < 0 ? "is-negative" : type === "very" ? "is-very" : "is-plain";

  return `
    <div class="seed-line ${toneClass}">
      <div class="seed-line__meta">
        <img class="seed-icon" src="${escapeHTML(icon)}" alt="">
        <span>${escapeHTML(label)}</span>
      </div>
      <strong>${escapeHTML(formatSignedNumber(Math.round(value)))}</strong>
    </div>
  `;
}

function renderShareLine(entry) {
  const meta = FLAVOR_META[entry.flavor];

  return `
    <div class="seed-line is-plain">
      <div class="seed-line__meta">
        <img class="seed-icon" src="${escapeHTML(meta.plainIcon)}" alt="">
        <span>${escapeHTML(meta.label)}</span>
      </div>
      <strong>${escapeHTML(`${Math.round(entry.share * 100)}%`)}</strong>
    </div>
  `;
}

function renderModalMetric(label, value, tone = "default") {
  return `
    <div class="detail-tile ${tone !== "default" ? `is-${tone}` : ""}">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(value)}</strong>
    </div>
  `;
}

function getValuationLabels(valuationMode) {
  if (valuationMode === "self-use") {
    return {
      summary: "Self-use value",
      valueHeading: "Self-use breakdown",
      outputLabel: "Offset value",
      negativeLabel: "Buy pressure",
      priceModeLabel: "Value by Buy",
      dailyLabel: "Daily offset",
      cycleLabel: "Cycle offset",
    };
  }

  return {
    summary: "Sell value",
    valueHeading: "Profit breakdown",
    outputLabel: "Sell excess",
    negativeLabel: "Buyback",
    priceModeLabel: "Value by Sell",
    dailyLabel: "Daily",
    cycleLabel: "Cycle",
  };
}

function createRouteModalContent(group, flavor) {
  const route = group.activeRoute;
  const selectedFlavor = flavor === "all" ? route.targetFlavor : flavor;
  const selectedMeta = FLAVOR_META[selectedFlavor];
  const labels = getValuationLabels(route.valuationMode);
  const buybackTile =
    route.buybackValue > 0
      ? renderModalMetric(
          labels.negativeLabel,
          formatMoney(Math.round(route.buybackValue)),
          "negative",
        )
      : "";

  return `
    <div class="modal-layout seed-modal-layout">
      <div class="modal-hero seed-modal-hero">
        <div class="modal-hero__icon-wrap">
          <img
            class="modal-headline__icon"
            src="${escapeHTML(route.sprite)}"
            alt="${escapeHTML(route.shortName)} berry sprite"
            width="72"
            height="72"
          >
        </div>

        <div class="modal-headline__copy">
          <p class="eyebrow">${escapeHTML(route.family)}${group.hasVariants ? ` · ${escapeHTML(route.methodLabel)}` : ""}</p>
          <h3 id="seed-route-modal-title">${escapeHTML(route.shortName)}</h3>
          <p class="modal-headline__effect">${escapeHTML(route.category)} · ${escapeHTML(route.shareLabel)}</p>
        </div>

        <div class="modal-price ${route.dailyValue < 0 ? "is-negative" : ""}">${escapeHTML(formatSignedMoney(Math.round(route.dailyValue)))}</div>
      </div>

      <div class="modal-grid seed-modal-grid">
        <section class="modal-panel modal-panel--facts">
          <h4>Quick facts</h4>
          <div class="detail-list detail-list--cards">
            ${renderModalMetric("Grow time", formatHours(route.growthHours))}
            ${renderModalMetric("Standard days", `${route.standardDays} day`)}
            ${renderModalMetric("Average yield", formatYield(route.averageYield))}
            ${renderModalMetric("Yield spread", formatYieldProfile(route.yieldProfile))}
            ${renderModalMetric("Berries tooled", formatNumber(Math.round(route.totalBerries)))}
            ${renderModalMetric("Selected net", formatSignedNumber(Math.round(route.selectedFlavorTotal)), route.selectedFlavorTotal < 0 ? "negative" : "default")}
          </div>
        </section>

        <section class="modal-panel modal-panel--facts">
          <h4>${escapeHTML(labels.valueHeading)}</h4>
          <div class="detail-list detail-list--cards">
            ${renderModalMetric(labels.dailyLabel, formatSignedMoney(Math.round(route.dailyValue)), route.dailyValue < 0 ? "negative" : "default")}
            ${renderModalMetric(labels.cycleLabel, formatSignedMoney(Math.round(route.cycleValue)), route.cycleValue < 0 ? "negative" : "default")}
            ${renderModalMetric(labels.outputLabel, formatMoney(Math.round(route.outputValue)))}
            ${renderModalMetric("Tools", formatMoney(Math.round(route.harvestToolCost)), "negative")}
            ${buybackTile}
          </div>
        </section>

        <section class="modal-panel">
          <div class="recipe-block recipe-block--modal">
            <div class="recipe-block__head">
              <h4>Seed recipe</h4>
              <span class="recipe-block__count">${route.recipe.length} seeds</span>
            </div>
            <div class="recipe-list">${route.recipe.map((token) => renderRecipeChip(token, selectedFlavor)).join("")}</div>
            <p class="muted">Output colors follow flavor-point weighting. Value mode changes how the net seed output is priced.</p>
          </div>
        </section>

        <section class="modal-panel">
          <h4>${escapeHTML(selectedMeta.label)} output</h4>
          <div class="seed-line-list">
            ${renderFlavorLine(selectedFlavor, "plain", route.selectedFlavorNet.plain)}
            ${renderFlavorLine(selectedFlavor, "very", route.selectedFlavorNet.very)}
          </div>
        </section>

        <section class="modal-panel">
          <h4>Color split</h4>
          <div class="seed-line-list">
            ${route.shareBreakdown.map((entry) => renderShareLine(entry)).join("")}
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderRouteCard(group, flavor) {
  const route = group.activeRoute;
  const selectedFlavor = flavor === "all" ? route.targetFlavor : flavor;
  const labels = getValuationLabels(route.valuationMode);
  const headlineRoute = group.bestDailyRoute || route;
  const dailyTone = headlineRoute.dailyValue < 0 ? "is-negative" : "";
  const stats = [
    renderPreviewStat(
      "Selected net",
      formatSignedNumber(Math.round(route.selectedFlavorTotal)),
      route.selectedFlavorTotal < 0 ? "negative" : "default",
    ),
    renderPreviewStat("Tooled", formatNumber(Math.round(route.totalBerries))),
    renderPreviewStat(
      labels.cycleLabel,
      formatSignedMoney(Math.round(route.cycleValue)),
      route.cycleValue < 0 ? "negative" : "default",
    ),
  ].join("");
  const allFlavorLanes =
    flavor === "all"
      ? `
        <section class="seed-route-card__recipe-preview seed-route-card__lanes-preview">
          <div class="seed-panel__head">
            <h4>Route lanes</h4>
            <span>${escapeHTML(formatNumber(group.allFlavorRoutes.length))} flavors</span>
          </div>
          <div class="seed-route-lane-list">
            ${group.allFlavorRoutes.map((entry) => renderFlavorLane(entry, labels)).join("")}
          </div>
        </section>
      `
      : `
        <div class="seed-preview-stats">
          ${stats}
        </div>
      `;

  return `
    <article
      class="seed-route-card ${route.selfSustain ? "is-sustain" : "is-buyback"}"
      data-route-details="${escapeHTML(route.routeKey)}"
      tabindex="0"
      role="button"
      aria-label="Open ${escapeHTML(route.shortName)} seed route details"
    >
      <div class="seed-route-card__top">
        <div class="seed-route-card__icon-wrap">
          <img class="seed-route-card__berry" src="${escapeHTML(route.sprite)}" alt="${escapeHTML(route.shortName)} berry sprite">
        </div>

        <div class="seed-route-card__identity">
          <p class="eyebrow">${escapeHTML(route.family)}</p>
          <h3>${escapeHTML(route.shortName)}</h3>
          <p class="seed-route-card__family">${escapeHTML(route.category)}</p>
        </div>

        <div class="seed-route-card__daily ${dailyTone}">
          <span>${escapeHTML(flavor === "all" ? `Best ${labels.dailyLabel.toLowerCase()}` : labels.dailyLabel)}</span>
          <strong>${escapeHTML(formatSignedMoney(Math.round(headlineRoute.dailyValue)))}</strong>
        </div>
      </div>

      ${renderMethodSwitch(group)}

      <div class="seed-badges">
        ${group.hasVariants ? `<span class="seed-badge seed-badge--method">${escapeHTML(route.methodLabel)}</span>` : ""}
        <span class="seed-badge">${escapeHTML(formatHours(route.growthHours))} grow</span>
        <span class="seed-badge">${escapeHTML(route.standardDays)} day standard</span>
        <span class="seed-badge ${route.selfSustain ? "is-good" : "is-warn"}">${route.selfSustain ? "Self-sustain" : "Needs buyback"}</span>
        ${flavor !== "all" ? renderShareChips(route) : ""}
      </div>

      ${allFlavorLanes}

      <section class="seed-route-card__recipe-preview">
        <div class="seed-panel__head">
          <h4>Seed recipe</h4>
          <span>${escapeHTML(formatNumber(Math.round(route.totalBerries)))} tooled</span>
        </div>
        <div class="seed-chip-list">
          ${route.recipe.map((token) => renderRecipeChip(token, selectedFlavor)).join("")}
        </div>
      </section>

      ${route.buybackValue > 0 && flavor !== "all" ? `<p class="seed-route-card__note">${escapeHTML(labels.negativeLabel)} ${escapeHTML(formatMoney(Math.round(route.buybackValue)))} / cycle</p>` : ""}
    </article>
  `;
}

export function renderSeedFlavorTabs(target, tabs, activeFlavor) {
  target.innerHTML = tabs
    .map((tab) => {
      const icon = tab.plainIcon
        ? `<img class="seed-icon" src="${escapeHTML(tab.plainIcon)}" alt="">`
        : `<span class="seed-icon" aria-hidden="true">◎</span>`;

      return `
      <button class="flavor-tab ${tab.value === activeFlavor ? "is-active" : ""}" type="button" data-flavor-tab="${tab.value}">
        ${icon}
        <span>${escapeHTML(tab.label)}</span>
      </button>
    `;
    })
    .join("");
}

export function renderSeedHeroSummary(target, scenario) {
  if (!scenario.bestRoute) {
    target.innerHTML = '<span class="hero-pill">No routes yet</span>';
    return;
  }

  const labels = getValuationLabels(scenario.state.valuation);

  target.innerHTML = `
    <span class="hero-pill">${escapeHTML(formatNumber(scenario.state.totalPlots))} plots</span>
    <span class="hero-pill">${escapeHTML(labels.priceModeLabel)}</span>
    <span class="hero-pill">${escapeHTML(`${scenario.profitableCount} profitable`)}</span>
    <span class="hero-pill">${escapeHTML(`${scenario.selfSustainCount} self-sustain`)}</span>
    <span class="hero-pill">Best · ${escapeHTML(scenario.bestRoute.shortName)} · ${escapeHTML(scenario.bestRoute.targetFlavorLabel)} · ${escapeHTML(scenario.bestRoute.methodLabel)}</span>
  `;
}

export function renderSeedPriceSummary(target, scenario) {
  const flavor = scenario.state.flavor;
  const labels = getValuationLabels(scenario.state.valuation);

  if (flavor === "all") {
    target.innerHTML = `
      <span class="results-pill">${escapeHTML(labels.priceModeLabel)}</span>
      <span class="results-pill">All flavor cards</span>
      <span class="results-pill">Prices live in Shop</span>
      <span class="results-pill">Tools ${escapeHTML(formatMoney(350))}</span>
    `;
    return;
  }

  const selectedMeta = FLAVOR_META[flavor];
  const prices = getSeedPriceSummary(scenario.priceState, flavor);

  target.innerHTML = `
    <span class="results-pill">${escapeHTML(labels.priceModeLabel)}</span>
    <span class="results-pill">${escapeHTML(selectedMeta.plainLabel)} S ${escapeHTML(formatMoney(prices.plainSell))} · B ${escapeHTML(formatMoney(prices.plainBuy))}</span>
    <span class="results-pill">${escapeHTML(selectedMeta.veryLabel)} S ${escapeHTML(formatMoney(prices.verySell))} · B ${escapeHTML(formatMoney(prices.veryBuy))}</span>
    <span class="results-pill">Tools ${escapeHTML(formatMoney(350))}</span>
  `;
}

export function renderSeedResultsSummary(target, visibleCount, totalCount, label, valuationMode) {
  const labels = getValuationLabels(valuationMode);
  const entityLabel = "berries";

  target.innerHTML = `${escapeHTML(formatNumber(visibleCount))} of ${escapeHTML(formatNumber(totalCount))} ${escapeHTML(entityLabel)} · ${escapeHTML(label)} · ${escapeHTML(labels.summary)}`;
}

export function renderSeedRoutes(target, scenario) {
  target.innerHTML = scenario.groups
    .map((group) => renderRouteCard(group, scenario.state.flavor))
    .join("");
}

export function renderSeedModalContent(target, group, flavor) {
  target.innerHTML = createRouteModalContent(group, flavor);
}
