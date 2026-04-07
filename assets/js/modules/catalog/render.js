// assets/js/modules/catalog/render.js
// v2.0.0-beta
// HTML render helpers for berry cards, summaries, selects, and modal content with local berry and seed sprites.
import {
  escapeHTML,
  formatHours,
  formatMoney,
  formatPercent,
  formatSignedMoney,
  formatYield,
  formatYieldProfile,
} from "../format.js";

function parseSeedLabel(seedLabel) {
  const [kind, flavor] = seedLabel.toLowerCase().split(" ");

  return {
    kind,
    flavor,
  };
}

function getAssetBase() {
  return document.body?.dataset?.assetBase || "assets";
}

function getBerryIconPath(slug) {
  return `${getAssetBase()}/img/berries/${slug}.png`;
}

function getSeedIconPath(seedLabel) {
  const { kind, flavor } = parseSeedLabel(seedLabel);

  return `${getAssetBase()}/img/seeds/${kind}-${flavor}.png`;
}

function renderSeedIcon(seedLabel, className = "seed-icon") {
  return `
    <img
      class="${escapeHTML(className)}"
      src="${escapeHTML(getSeedIconPath(seedLabel))}"
      alt="${escapeHTML(seedLabel)} seed"
      loading="lazy"
      width="24"
      height="24"
    >
  `;
}

function renderRecipeChip(seedLabel) {
  const { kind } = parseSeedLabel(seedLabel);

  return `
    <span class="recipe-chip recipe-chip--${escapeHTML(kind)}">
      ${renderSeedIcon(seedLabel)}
      <span class="recipe-chip__text">${escapeHTML(seedLabel)}</span>
    </span>
  `;
}

function renderLegendItem(flavor) {
  const label = `${flavor[0].toUpperCase()}${flavor.slice(1)}`;
  const seedLabel = `Plain ${label}`;

  return `
    <span class="legend-item">
      ${renderSeedIcon(seedLabel, "seed-icon seed-icon--legend")}
      ${escapeHTML(label)}
    </span>
  `;
}

function renderFactChip(label, value) {
  return `
    <div class="fact-chip">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(value)}</strong>
    </div>
  `;
}

function renderBreakdownSummary(seedHarvest) {
  return seedHarvest.flavorBreakdown
    .map((entry) => {
      const typeParts = [];

      if (entry.plainShare > 0.001) {
        typeParts.push(`P ${formatPercent(entry.plainShare)}`);
      }

      if (entry.veryShare > 0.001) {
        typeParts.push(`V ${formatPercent(entry.veryShare)}`);
      }

      return `${entry.label} ${typeParts.join(" / ")} · exp ${formatMoney(Math.round(entry.expectedBuyValue))}`;
    })
    .join(" · ");
}

function createBerryCard(berry) {
  return `
    <article
      class="catalog-card"
      data-berry-card
      data-berry-details="${escapeHTML(berry.slug)}"
      tabindex="0"
      role="button"
      aria-label="Open ${escapeHTML(berry.name)} details"
    >
      <div class="catalog-card__header">
        <div class="catalog-card__sprite-wrap">
          <img
            class="catalog-card__icon"
            src="${escapeHTML(getBerryIconPath(berry.slug))}"
            alt="${escapeHTML(berry.name)} sprite"
            loading="lazy"
            width="58"
            height="58"
          >
        </div>

        <div class="catalog-card__identity">
          <h3>${escapeHTML(berry.shortName)}</h3>
          <p class="catalog-card__category">${escapeHTML(berry.category)}</p>
        </div>

        <span class="catalog-card__vendor">${formatMoney(berry.vendorPrice)}</span>
      </div>

      <p class="catalog-card__effect">${escapeHTML(berry.effect)}</p>

      <div class="fact-row">
        ${renderFactChip("Grow", formatHours(berry.growthHours))}
        ${renderFactChip("Value", formatMoney(berry.vendorPrice))}
        ${renderFactChip("Avg", formatYield(berry.yieldPerPlot))}
      </div>

      <div class="recipe-block">
        <div class="recipe-block__head">
          <span class="recipe-block__label">Recipe</span>
          <span class="recipe-block__count">${berry.seedRecipe.length} seeds</span>
        </div>
        <div class="recipe-list">${berry.seedRecipe.map(renderRecipeChip).join("")}</div>
      </div>
    </article>
  `;
}

export function renderCatalog(target, berries) {
  if (!berries.length) {
    target.innerHTML = `
      <div class="empty-state">
        <p><strong>No berries match the current filters.</strong></p>
        <p class="muted">Try a broader search or clear the filters.</p>
      </div>
    `;
    return;
  }

  target.innerHTML = berries.map(createBerryCard).join("");
}

export function renderSelectOptions(target, options, makeLabel) {
  target.innerHTML = options
    .map(
      (option) =>
        `<option value="${escapeHTML(String(option))}">${escapeHTML(makeLabel(option))}</option>`,
    )
    .join("");
}

export function renderResultsSummary(target, shownCount, totalCount, sortLabel) {
  target.innerHTML = `
    <span class="results-pill">${shownCount} shown</span>
    <span class="results-pill">${totalCount} total</span>
    <span class="results-pill">${escapeHTML(sortLabel)}</span>
  `;
}

export function renderHeroSummary(target, summary) {
  target.innerHTML = `
    <span class="hero-pill">${summary.total} berries</span>
    <span class="hero-pill">Avg ${formatMoney(summary.averageVendor)}</span>
    <span class="hero-pill">Fastest ${escapeHTML(summary.fastest.shortName)} · ${formatHours(summary.fastest.growthHours)}</span>
    <span class="hero-pill">Slowest ${escapeHTML(summary.slowest.shortName)} · ${formatHours(summary.slowest.growthHours)}</span>
  `;
}

export function renderFlavorLegend() {
  return ["bitter", "dry", "spicy", "sour", "sweet"].map(renderLegendItem).join("");
}

export function renderModalContent(target, berry, seedHarvest) {
  const edgeClass = seedHarvest.currentEdge < 0 ? " is-negative" : "";
  const totalCostClass =
    seedHarvest.currentTotalCost > seedHarvest.expectedSeedBuyValue ? " is-negative" : "";
  const breakdownSummary = renderBreakdownSummary(seedHarvest);
  const breakpointNote = seedHarvest.isBlended
    ? "Mixed-output berry: color odds are weighted by the recipe itself (Plain = 1 point, Very = 2 points), and only colors with a Very seed in the recipe can roll Very outputs."
    : "Pure-color berry: this breakpoint compares one harvested seed per berry against the current Shop seed buys, with Very output only available when the recipe itself contains a Very seed.";

  target.innerHTML = `
    <div class="modal-layout">
      <div class="modal-hero">
        <div class="modal-hero__icon-wrap">
          <img
            class="modal-headline__icon"
            src="${escapeHTML(getBerryIconPath(berry.slug))}"
            alt="${escapeHTML(berry.name)} sprite"
            width="72"
            height="72"
          >
        </div>

        <div class="modal-headline__copy">
          <p class="eyebrow">${escapeHTML(berry.category)}</p>
          <h3 id="modal-title">${escapeHTML(berry.name)}</h3>
          <p class="modal-headline__effect">${escapeHTML(berry.effect)}</p>
        </div>

        <div class="modal-price">${formatMoney(berry.vendorPrice)}</div>
      </div>

      <div class="modal-grid">
        <section class="modal-panel modal-panel--facts">
          <h4>Quick facts</h4>
          <div class="detail-list detail-list--cards">
            <div class="detail-tile">
              <span>Grow time</span>
              <strong>${formatHours(berry.growthHours)}</strong>
            </div>
            <div class="detail-tile">
              <span>Vendor value</span>
              <strong>${formatMoney(berry.vendorPrice)}</strong>
            </div>
            <div class="detail-tile">
              <span>Average yield</span>
              <strong>${formatYield(berry.yieldPerPlot)}</strong>
            </div>
            <div class="detail-tile">
              <span>Yield spread</span>
              <strong>${formatYieldProfile(berry.yieldProfile)}</strong>
            </div>
          </div>
        </section>

        <section class="modal-panel">
          <div class="recipe-block recipe-block--modal">
            <div class="recipe-block__head">
              <h4>Seed recipe</h4>
              <span class="recipe-block__count">${berry.seedRecipe.length} seeds</span>
            </div>
            <div class="recipe-list">${berry.seedRecipe.map(renderRecipeChip).join("")}</div>
            <p class="muted">Yield spread: ${formatYieldProfile(berry.yieldProfile)}</p>
          </div>

          <div class="recipe-block recipe-block--modal">
            <div class="recipe-block__head">
              <h4>Seed harvest breakpoint</h4>
              <span class="recipe-block__count">1 Harvest Tool / berry</span>
            </div>
            <div class="detail-list detail-list--cards">
              <div class="detail-tile">
                <span>Expected seed buy value</span>
                <strong>${formatMoney(Math.round(seedHarvest.expectedSeedBuyValue))}</strong>
              </div>
              <div class="detail-tile">
                <span>Break-even berry buy</span>
                <strong>${formatMoney(Math.round(seedHarvest.breakEvenBerryBuy))}</strong>
              </div>
              <div class="detail-tile${totalCostClass}">
                <span>Current berry + tool</span>
                <strong>${formatMoney(Math.round(seedHarvest.currentTotalCost))}</strong>
              </div>
              <div class="detail-tile${edgeClass}">
                <span>Current edge</span>
                <strong>${formatSignedMoney(Math.round(seedHarvest.currentEdge))}</strong>
              </div>
            </div>
            <p class="muted">Output mix: ${escapeHTML(breakdownSummary)}</p>
            <p class="muted">${escapeHTML(breakpointNote)}</p>
          </div>
        </section>
      </div>
    </div>
  `;
}
