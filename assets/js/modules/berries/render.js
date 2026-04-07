// assets/js/modules/berries/render.js
// v2.0.0-beta
// Render helpers for Berry Routes with simple buy-seed cards and detail modal.
import {
  escapeHTML,
  formatHours,
  formatMoney,
  formatYield,
  formatYieldProfile,
} from "../format.js";
import { FLAVOR_META } from "../pricing/defaults.js";

function formatSignedMoney(value) {
  const rounded = Math.round(value);
  return `${rounded >= 0 ? "+" : "−"}${formatMoney(Math.abs(rounded))}`;
}

function renderMethodSwitch(group) {
  if (!group.hasVariants) {
    return "";
  }

  return `
    <div class="berry-method-switch" role="group" aria-label="Berry method switch for ${escapeHTML(group.activeRoute.shortName)}">
      ${group.methods
        .map(
          (route) => `
        <button
          class="berry-method-chip ${route.methodKey === group.activeMethodKey ? "is-active" : ""}"
          type="button"
          data-berry-method="${escapeHTML(route.methodKey)}"
          data-berry-slug="${escapeHTML(group.berrySlug)}"
        >
          ${escapeHTML(route.methodLabel)}
        </button>
      `,
        )
        .join("")}
    </div>
  `;
}

function renderRecipeChip(token) {
  const [type, ...rest] = token.split(" ");
  const flavor = rest.join(" ").toLowerCase();
  const icon = `../assets/img/seeds/${type.toLowerCase()}-${flavor}.png`;

  return `
    <span class="recipe-chip recipe-chip--${escapeHTML(type.toLowerCase())}">
      <img class="seed-icon" src="${escapeHTML(icon)}" alt="">
      <span class="recipe-chip__text">${escapeHTML(token)}</span>
    </span>
  `;
}

function renderPreviewStat(label, value, tone = "default") {
  return `
    <div class="berry-preview-stat ${tone !== "default" ? `is-${tone}` : ""}">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(value)}</strong>
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

function renderSeedPrepBlock(route) {
  if (!route.seedPrep) {
    return "";
  }

  const flavorMeta = FLAVOR_META[route.seedPrep.flavor];

  return `
    <section class="modal-panel">
      <div class="recipe-block recipe-block--modal">
        <div class="recipe-block__head">
          <h4>Seed prep loop</h4>
          <span class="recipe-block__count">${escapeHTML(route.seedPrep.methodLabel)}</span>
        </div>
        <div class="berry-seed-prep">
          <div class="berry-seed-prep__head">
            <img class="seed-line__berry" src="${escapeHTML(route.seedPrep.sprite)}" alt="${escapeHTML(route.seedPrep.shortName)} berry sprite">
            <div>
              <strong>${escapeHTML(route.seedPrep.shortName)}</strong>
              <span>${escapeHTML(flavorMeta.label)} seeds · ${escapeHTML(route.seedPrep.methodLabel)} · ${escapeHTML(formatHours(route.seedPrep.growthHours))}</span>
            </div>
          </div>
          <div class="seed-chip-list">
            ${route.seedPrep.recipe.map((token) => renderRecipeChip(token)).join("")}
          </div>
          <div class="detail-list detail-list--cards">
            ${renderModalMetric("Seed cycles / berry cycle", route.seedPrep.seedCycles.toFixed(2))}
            ${renderModalMetric("Prep days", route.seedPrep.prepDays.toFixed(2))}
            ${renderModalMetric("Prep tool cost", formatMoney(Math.round(route.seedPrep.prepToolCost)), "negative")}
            ${renderModalMetric("Net plain / prep cycle", Math.round(route.seedPrep.netPlain).toLocaleString("en-US"))}
            ${renderModalMetric("Net very / prep cycle", Math.round(route.seedPrep.netVery).toLocaleString("en-US"))}
            ${renderModalMetric("Berry recipe need", `${Math.round(route.seedPrep.needPlain).toLocaleString("en-US")} P · ${Math.round(route.seedPrep.needVery).toLocaleString("en-US")} V`)}
          </div>
        </div>
      </div>
    </section>
  `;
}

function createBerryModalContent(group) {
  const route = group.activeRoute;

  return `
    <div class="modal-layout berry-modal-layout">
      <div class="modal-hero berry-modal-hero">
        <div class="modal-hero__icon-wrap">
          <img class="modal-headline__icon" src="${escapeHTML(route.sprite)}" alt="${escapeHTML(route.shortName)} berry sprite" width="72" height="72">
        </div>

        <div class="modal-headline__copy">
          <p class="eyebrow">${escapeHTML(route.methodLabel)}</p>
          <h3 id="berry-route-modal-title">${escapeHTML(route.shortName)} Berry</h3>
          <p class="modal-headline__effect">${escapeHTML(route.category)} · ${escapeHTML(route.methodSubtitle)}</p>
        </div>

        <div class="modal-price ${route.dailyValue < 0 ? "is-negative" : ""}">${escapeHTML(formatSignedMoney(route.dailyValue))}</div>
      </div>

      <div class="modal-grid berry-modal-grid">
        <section class="modal-panel modal-panel--facts">
          <h4>Quick facts</h4>
          <div class="detail-list detail-list--cards">
            ${renderModalMetric("Sell price", formatMoney(Math.round(route.sellPrice)))}
            ${renderModalMetric("Grow time", formatHours(route.growthHours))}
            ${renderModalMetric("Berry days", `${route.standardDays} day`)}
            ${renderModalMetric("Bundle days", route.bundleDays.toFixed(2))}
            ${renderModalMetric("Average yield", formatYield(route.averageYield))}
            ${renderModalMetric("Yield spread", formatYieldProfile(route.yieldProfile))}
            ${renderModalMetric("Berries sold", String(Math.round(route.totalBerries).toLocaleString("en-US")))}
            ${renderModalMetric("Total plots", String(route.totalPlots))}
          </div>
        </section>

        <section class="modal-panel modal-panel--facts">
          <h4>Profit breakdown</h4>
          <div class="detail-list detail-list--cards">
            ${renderModalMetric("Daily value", formatSignedMoney(route.dailyValue), route.dailyValue < 0 ? "negative" : "default")}
            ${renderModalMetric("Bundle value", formatSignedMoney(route.cycleValue), route.cycleValue < 0 ? "negative" : "default")}
            ${renderModalMetric("Berry revenue", formatMoney(Math.round(route.revenue)))}
            ${route.isSelfSufficient ? renderModalMetric("Seed spend", "Initial seeds ignored") : renderModalMetric("Seed spend", formatMoney(Math.round(route.seedSpend)), "negative")}
            ${route.seedPrep ? renderModalMetric("Seed prep tool cost", formatMoney(Math.round(route.seedPrep.prepToolCost)), "negative") : ""}
            ${renderModalMetric("Per character", formatSignedMoney(route.perCharacterDaily), route.perCharacterDaily < 0 ? "negative" : "default")}
          </div>
        </section>

        <section class="modal-panel">
          <div class="recipe-block recipe-block--modal">
            <div class="recipe-block__head">
              <h4>Berry recipe</h4>
              <span class="recipe-block__count">${route.recipe.length} seeds</span>
            </div>
            <div class="recipe-list">${route.recipe.map((token) => renderRecipeChip(token)).join("")}</div>
            <p class="muted">${route.isSelfSufficient ? "This bundle grows the needed seeds first, then plants the berry." : "This method buys the recipe every cycle and sells every harvested berry."}</p>
          </div>
        </section>

        <section class="modal-panel">
          <h4>Recipe spend</h4>
          <div class="seed-line-list">
            ${route.recipeBreakdown
              .map(
                (entry) => `
              <div class="seed-line is-plain">
                <div class="seed-line__meta">
                  <img class="seed-icon" src="../assets/img/seeds/${escapeHTML(entry.parsed.type)}-${escapeHTML(entry.parsed.flavor)}.png" alt="">
                  <span>${escapeHTML(entry.token)}</span>
                </div>
                <strong>${escapeHTML(route.isSelfSufficient ? "Internal loop" : formatMoney(Math.round(entry.cycleCost)))}</strong>
              </div>
            `,
              )
              .join("")}
          </div>
        </section>

        ${renderSeedPrepBlock(route)}
      </div>
    </div>
  `;
}

function renderBerryCard(group) {
  const route = group.activeRoute;
  const stats = route.isSelfSufficient
    ? [
        renderPreviewStat("Bundle days", route.bundleDays.toFixed(2)),
        renderPreviewStat("Prep method", route.seedPrep.methodLabel),
        renderPreviewStat("Avg yield", formatYield(route.averageYield)),
      ].join("")
    : [
        renderPreviewStat("Sell", formatMoney(Math.round(route.sellPrice))),
        renderPreviewStat("Seed spend", formatMoney(Math.round(route.seedSpend)), "negative"),
        renderPreviewStat("Avg yield", formatYield(route.averageYield)),
      ].join("");

  return `
    <article
      class="berry-route-card ${route.isSelfSufficient ? "is-own" : "is-bought"}"
      data-berry-route-details="${escapeHTML(route.routeKey)}"
      tabindex="0"
      role="button"
      aria-label="Open ${escapeHTML(route.shortName)} berry route details"
    >
      <div class="berry-route-card__top">
        <div class="berry-route-card__icon-wrap">
          <img class="berry-route-card__berry" src="${escapeHTML(route.sprite)}" alt="${escapeHTML(route.shortName)} berry sprite">
        </div>

        <div class="berry-route-card__identity">
          <p class="eyebrow">${escapeHTML(route.methodLabel)}</p>
          <h3>${escapeHTML(route.shortName)}</h3>
          <p class="berry-route-card__family">${escapeHTML(route.category)}</p>
        </div>

        <div class="berry-route-card__daily ${route.dailyValue < 0 ? "is-negative" : ""}">
          <span>Daily</span>
          <strong>${escapeHTML(formatSignedMoney(route.dailyValue))}</strong>
        </div>
      </div>

      ${renderMethodSwitch(group)}

      <div class="seed-badges">
        <span class="seed-badge">${escapeHTML(formatHours(route.growthHours))} grow</span>
        <span class="seed-badge">${escapeHTML(route.standardDays)} day berry</span>
        ${route.isSelfSufficient ? `<span class="seed-badge is-good">Pure loop</span>` : `<span class="seed-badge">Buy every cycle</span>`}
        ${route.seedPrep ? `<span class="seed-badge">Prep ${escapeHTML(route.seedPrep.prepDays.toFixed(2))}d</span>` : ""}
      </div>

      <div class="berry-preview-stats">
        ${stats}
      </div>

      <section class="berry-route-card__recipe-preview">
        <div class="seed-panel__head">
          <h4>Berry recipe</h4>
          <span>${escapeHTML(String(route.recipe.length))} seeds</span>
        </div>
        <div class="seed-chip-list">
          ${route.recipe.map((token) => renderRecipeChip(token)).join("")}
        </div>
      </section>
    </article>
  `;
}

export function renderBerryHeroSummary(target, scenario) {
  if (!scenario.bestRoute) {
    target.innerHTML = '<span class="hero-pill">No routes yet</span>';
    return;
  }

  target.innerHTML = `
    <span class="hero-pill">${escapeHTML(String(scenario.state.totalPlots))} plots</span>
    <span class="hero-pill">${escapeHTML(`${scenario.totalCount} berries`)}</span>
    <span class="hero-pill">${escapeHTML(`${scenario.profitableCount} profitable`)}</span>
    <span class="hero-pill">${escapeHTML(`${scenario.selfCount} pure loops`)}</span>
    <span class="hero-pill">Best · ${escapeHTML(scenario.bestRoute.shortName)} · ${escapeHTML(scenario.bestRoute.methodLabel)}</span>
  `;
}

export function renderBerryPriceSummary(target, scenario) {
  target.innerHTML = `
    <span class="results-pill">Berry mode · ${escapeHTML(scenario.priceState.berries.mode)}</span>
    <span class="results-pill">Harvest Tool · fixed 350</span>
  `;
}

export function renderBerryResultsSummary(target, visibleCount, totalCount, label) {
  target.innerHTML = `
    <span class="results-pill">${escapeHTML(`${visibleCount} of ${totalCount} berries`)}</span>
    <span class="results-pill">${escapeHTML(label)}</span>
  `;
}

export function renderBerryRouteCards(target, groups) {
  if (groups.length === 0) {
    target.innerHTML =
      '<div class="empty-state"><p>No berry routes match the current filters.</p></div>';
    return;
  }

  target.innerHTML = groups.map((group) => renderBerryCard(group)).join("");
}

export function openBerryRouteModal(target, group) {
  if (!group) {
    target.innerHTML = "";
    return;
  }
  target.innerHTML = createBerryModalContent(group);
}
