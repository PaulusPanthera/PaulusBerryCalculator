// assets/js/modules/shopping/render.js
// v2.0.0-beta
// Rendering helpers for the Shopping List page, cart entries, and aggregated seed buy basket.
import { escapeHTML, formatMoney, formatNumber, formatYield } from "../format.js";

function renderRecipeChip(token) {
  const [type, flavor] = token.split(" ");
  const safeType = type.toLowerCase() === "very" ? "very" : "plain";
  const slug = `${safeType}-${flavor.toLowerCase()}`;

  return `
    <span class="recipe-chip recipe-chip--${escapeHTML(safeType)}">
      <img class="seed-icon" src="../assets/img/seeds/${escapeHTML(slug)}.png" alt="${escapeHTML(token)} icon">
      <span class="recipe-chip__text">${escapeHTML(token)}</span>
    </span>
  `;
}

export function renderBerryOptions(selectNode, berries, selectedSlug) {
  selectNode.innerHTML = berries
    .map(
      (berry) => `
        <option value="${escapeHTML(berry.slug)}"${berry.slug === selectedSlug ? " selected" : ""}>
          ${escapeHTML(berry.shortName)}
        </option>
      `,
    )
    .join("");
}

export function renderMethodOptions(selectNode, methods, selectedKey) {
  selectNode.innerHTML = methods
    .map(
      (method) => `
        <option value="${escapeHTML(method.key)}"${method.key === selectedKey ? " selected" : ""}>
          ${escapeHTML(method.label)}
        </option>
      `,
    )
    .join("");
}

export function renderShoppingHeroSummary(target, plan) {
  const averageBuyPerPlot =
    plan.totalPlots > 0 ? plan.seedTotals.totalBuyCost / plan.totalPlots : 0;

  target.innerHTML = `
    <span class="hero-pill">Entries · ${escapeHTML(String(plan.totalEntries))}</span>
    <span class="hero-pill">Full runs · ${escapeHTML(formatNumber(plan.totalRuns))}</span>
    <span class="hero-pill">Plots · ${escapeHTML(formatNumber(plan.totalPlots))}</span>
    <span class="hero-pill">Seeds to buy · ${escapeHTML(formatNumber(plan.seedTotals.totalBuyCount))}</span>
    <span class="hero-pill">Basket · ${escapeHTML(formatMoney(plan.seedTotals.totalBuyCost))}</span>
    <span class="hero-pill">Avg / plot · ${escapeHTML(formatMoney(Math.round(averageBuyPerPlot)))} </span>
  `;
}

export function renderCartSummary(target, plan) {
  if (plan.totalEntries <= 0) {
    target.textContent = "Cart empty · add a berry plan to build the shopping basket.";
    return;
  }

  target.textContent = `${formatNumber(plan.totalEntries)} entries · ${formatNumber(plan.totalRuns)} full runs · ${formatNumber(plan.totalPlots)} plots · ${formatMoney(plan.seedTotals.totalBuyCost)} to buy`;
}

export function renderCartEntries(target, plan) {
  if (plan.entries.length <= 0) {
    target.innerHTML = `
      <div class="empty-state">
        <p>No berry plans yet.</p>
        <p class="muted">Pick a berry, set characters and plantings, then add it to the cart.</p>
      </div>
    `;
    return;
  }

  target.innerHTML = plan.entries
    .map((entry) => {
      const sellReferenceNote =
        entry.currentSellPrice === entry.berry.vendorPrice ? "Vendor" : "Current sell";

      return `
        <article class="shopping-entry-card">
          <div class="shopping-entry-card__top">
            <div class="seed-route-card__icon-wrap">
              <img class="seed-route-card__berry" src="../assets/img/berries/${escapeHTML(entry.berry.slug)}.png" alt="${escapeHTML(entry.berry.shortName)} berry sprite">
            </div>
            <div class="shopping-entry-card__identity">
              <p class="eyebrow">${escapeHTML(entry.methodLabel)} · ${escapeHTML(String(entry.berry.seedRecipe.length))} seed recipe</p>
              <h3>${escapeHTML(entry.berry.shortName)}</h3>
              <p class="shopping-entry-card__meta">${escapeHTML(formatNumber(entry.characters))} char · ${escapeHTML(formatNumber(entry.plantings))} planting${entry.plantings === 1 ? "" : "s"} each · ${escapeHTML(String(entry.standardDays))} day cycle</p>
            </div>
            <button class="button button--ghost shopping-entry-card__remove" data-remove-entry="${escapeHTML(entry.id)}" type="button">
              Remove
            </button>
          </div>

          <div class="seed-preview-stats">
            <div class="seed-preview-stat">
              <span>Plots</span>
              <strong>${escapeHTML(formatNumber(entry.totalPlots))}</strong>
            </div>
            <div class="seed-preview-stat">
              <span>Seed buy</span>
              <strong>${escapeHTML(formatMoney(entry.seedCost))}</strong>
            </div>
            <div class="seed-preview-stat">
              <span>${escapeHTML(sellReferenceNote)}</span>
              <strong>${escapeHTML(formatMoney(Math.round(entry.grossSellValue)))}</strong>
            </div>
          </div>

          <section class="seed-route-card__recipe-preview">
            <div class="seed-panel__head">
              <h4>Recipe</h4>
              <span>${escapeHTML(formatYield(entry.berry.yieldPerPlot))}</span>
            </div>
            <div class="recipe-list">${entry.method.recipe.map(renderRecipeChip).join("")}</div>
          </section>
        </article>
      `;
    })
    .join("");
}

export function renderSeedNeedSummary(target, plan) {
  if (plan.totalEntries <= 0) {
    target.textContent = "No seeds needed yet.";
    return;
  }

  target.textContent = `${formatNumber(plan.seedTotals.totalNeed)} total seeds needed · ${formatNumber(plan.seedTotals.totalBuyCount)} still to buy · ${formatMoney(plan.seedTotals.totalBuyCost)}`;
}

export function renderSeedBasket(target, plan) {
  target.innerHTML = plan.seedTotals.rows
    .filter((row) => row.need > 0 || row.inBag > 0)
    .map(
      (row) => `
        <div class="shopping-seed-row ${row.type === "very" ? "shopping-seed-row--very" : ""}">
          <div class="shopping-seed-row__identity">
            <img class="seed-icon" src="${escapeHTML(row.icon)}" alt="${escapeHTML(row.label)} icon">
            <div>
              <strong>${escapeHTML(row.label)}</strong>
              <span>${escapeHTML(formatMoney(row.price))} each</span>
            </div>
          </div>

          <div class="shopping-seed-row__metric">
            <span>Need</span>
            <strong>${escapeHTML(formatNumber(row.need))}</strong>
          </div>

          <label class="field shopping-seed-row__bag" for="shopping-bag-${escapeHTML(row.flavor)}-${escapeHTML(row.type)}">
            <span>In bag</span>
            <input
              id="shopping-bag-${escapeHTML(row.flavor)}-${escapeHTML(row.type)}"
              data-shopping-flavor="${escapeHTML(row.flavor)}"
              data-shopping-type="${escapeHTML(row.type)}"
              type="number"
              min="0"
              step="1"
              value="${escapeHTML(String(row.inBag))}"
            >
          </label>

          <div class="shopping-seed-row__metric">
            <span>Buy</span>
            <strong>${escapeHTML(formatNumber(row.buy))}</strong>
          </div>

          <div class="shopping-seed-row__metric">
            <span>Cost</span>
            <strong>${escapeHTML(formatMoney(row.cost))}</strong>
          </div>
        </div>
      `,
    )
    .join("");

  if (!target.innerHTML.trim()) {
    target.innerHTML = `
      <div class="empty-state">
        <p>No active seed lines yet.</p>
        <p class="muted">As soon as the cart has entries, the basket will aggregate every required seed type here.</p>
      </div>
    `;
  }
}
