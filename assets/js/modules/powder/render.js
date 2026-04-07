// assets/js/modules/powder/render.js
// v2.0.0-beta
// Rendering helpers for powder route cards, summaries, and detail modal.
import {
  escapeHTML,
  formatHours,
  formatMoney,
  formatNumber,
  formatSignedMoney,
  formatYield,
} from "../format.js";

function renderStat(label, value, tone = "default") {
  return `
    <div class="seed-preview-stat seed-preview-stat--${escapeHTML(tone)}">
      <span>${escapeHTML(label)}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function renderIngredientLine(entry) {
  if (!entry) return "";
  return `
    <div class="seed-line-item">
      <span>${escapeHTML(entry.label)}</span>
      <strong>${escapeHTML(formatNumber(Math.round(entry.quantity * 100) / 100))} × ${escapeHTML(formatMoney(entry.unitPrice))}</strong>
      <em>${escapeHTML(formatMoney(Math.round(entry.cost)))}</em>
    </div>
  `;
}

export function renderPowderHeroSummary(target, scenario) {
  return `
    <span class="hero-pill">${escapeHTML(target.label)}</span>
    <span class="hero-pill">${escapeHTML(String(scenario.characters))} character${scenario.characters === 1 ? "" : "s"}</span>
    <span class="hero-pill">${escapeHTML(String(scenario.profitableCount))} profitable</span>
  `;
}

export function renderPowderPriceSummary(target) {
  const ingredientSummary =
    [target.ingredient1?.label, target.ingredient2?.label].filter(Boolean).join(" + ") ||
    "No extra ingredient";
  return `
    <span>${escapeHTML(target.label)} sell price from Shop</span>
    <span>·</span>
    <span>${escapeHTML(ingredientSummary)}</span>
  `;
}

export function renderPowderResultsSummary(visibleCount, totalCount, sortLabel) {
  return `${visibleCount} of ${totalCount} routes · ${sortLabel}`;
}

export function renderPowderRouteCards(target, routes) {
  return routes
    .map((route) => {
      const status = route.profitable ? "Craftable" : "Under water";
      const badgeTone = route.profitable ? "good" : "bad";

      return `
      <article class="seed-route-card" data-powder-route-details="${escapeHTML(route.routeKey)}" tabindex="0" role="button" aria-label="Open ${escapeHTML(route.berry.shortName)} powder details">
        <div class="seed-route-card__top">
          <div class="seed-route-card__icon-wrap">
            <img class="seed-route-card__berry" src="../assets/img/berries/${escapeHTML(route.berry.slug)}.png" alt="${escapeHTML(route.berry.shortName)} berry sprite">
          </div>
          <div class="seed-route-card__identity">
            <p class="eyebrow">${escapeHTML(target.label)}</p>
            <h3>${escapeHTML(route.berry.shortName)}</h3>
            <p class="seed-route-card__subtitle">${escapeHTML(route.berry.category)} · ${escapeHTML(formatHours(route.berry.growthHours))}</p>
          </div>
          <div class="seed-route-card__value ${route.dailyValue < 0 ? "is-negative" : ""}">
            <span>Daily</span>
            <strong>${escapeHTML(formatSignedMoney(Math.round(route.dailyValue)))}</strong>
          </div>
        </div>

        <div class="seed-method-strip">
          <span class="seed-method-chip seed-method-chip--${escapeHTML(badgeTone)}">${escapeHTML(status)}</span>
          <span class="seed-method-chip">${escapeHTML(String(route.standardDays))}d standard</span>
        </div>

        <div class="seed-preview-grid">
          ${renderStat("Powder", escapeHTML(formatNumber(Math.round(route.totalBerries))))}
          ${renderStat(target.label, escapeHTML(formatNumber(Math.round(route.itemYield * 100) / 100)))}
          ${renderStat("Plant cost", escapeHTML(formatMoney(Math.round(route.plantCost))))}
        </div>
      </article>
    `;
    })
    .join("");
}

export function renderPowderModal(route) {
  return `
    <div class="modal-stack powder-modal">
      <div class="modal-hero modal-hero--route">
        <div class="modal-hero__media">
          <img class="modal-berry-sprite" src="../assets/img/berries/${escapeHTML(route.berry.slug)}.png" alt="${escapeHTML(route.berry.shortName)} berry sprite">
        </div>
        <div class="modal-hero__copy">
          <p class="eyebrow">${escapeHTML(route.target.label)}</p>
          <h2 id="modal-title">${escapeHTML(route.berry.shortName)}</h2>
          <p>${escapeHTML(route.berry.effect)}</p>
        </div>
        <div class="modal-hero__value ${route.dailyValue < 0 ? "is-negative" : ""}">
          <span>Daily value</span>
          <strong>${escapeHTML(formatSignedMoney(Math.round(route.dailyValue)))}</strong>
        </div>
      </div>

      <div class="modal-grid modal-grid--route">
        <section class="modal-panel">
          <h3>Route</h3>
          <div class="seed-preview-grid">
            ${renderStat("Grow time", escapeHTML(formatHours(route.berry.growthHours)))}
            ${renderStat("Yield", escapeHTML(formatYield(route.berry.yieldPerPlot)))}
            ${renderStat("Powder", escapeHTML(formatNumber(Math.round(route.totalBerries))))}
            ${renderStat(route.target.label, escapeHTML(formatNumber(Math.round(route.itemYield * 100) / 100)))}
          </div>
        </section>

        <section class="modal-panel">
          <h3>Costs</h3>
          <div class="seed-line-list">
            <div class="seed-line-item">
              <span>Plant cost</span>
              <strong>${escapeHTML(formatMoney(Math.round(route.plantCost)))}</strong>
            </div>
            ${renderIngredientLine(route.ingredient1)}
            ${renderIngredientLine(route.ingredient2)}
            <div class="seed-line-item seed-line-item--accent">
              <span>Total cost</span>
              <strong>${escapeHTML(formatMoney(Math.round(route.totalCost)))}</strong>
            </div>
          </div>
        </section>

        <section class="modal-panel">
          <h3>Return</h3>
          <div class="seed-line-list">
            <div class="seed-line-item">
              <span>${escapeHTML(route.target.label)} sell</span>
              <strong>${escapeHTML(formatMoney(route.itemSell))}</strong>
            </div>
            <div class="seed-line-item">
              <span>Revenue</span>
              <strong>${escapeHTML(formatMoney(Math.round(route.revenue)))}</strong>
            </div>
            <div class="seed-line-item">
              <span>Cycle</span>
              <strong>${escapeHTML(formatSignedMoney(Math.round(route.cycleValue)))}</strong>
            </div>
            <div class="seed-line-item seed-line-item--accent">
              <span>Daily</span>
              <strong>${escapeHTML(formatSignedMoney(Math.round(route.dailyValue)))}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;
}
