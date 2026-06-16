// assets/js/modules/leppa/render.js
// v2.0.0-beta
// Rendering helpers for the native Leppa planner page, route cards, and detail modal.
import { escapeHTML, formatMoney, formatNumber, formatSignedMoney } from "../format.js";

function formatQuantity(value) {
  const rounded = Math.round(value * 10) / 10;
  const hasDecimal = Math.abs(rounded % 1) > 0.001;

  return Number(rounded).toLocaleString("en-US", {
    minimumFractionDigits: hasDecimal ? 1 : 0,
    maximumFractionDigits: 1,
  });
}

function renderPreviewStat(label, value, tone = "default") {
  return `
    <div class="seed-preview-stat ${tone !== "default" ? `is-${tone}` : ""}">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(value)}</strong>
    </div>
  `;
}

function renderMetric(label, value, tone = "default") {
  return `
    <div class="detail-tile ${tone !== "default" ? `is-${tone}` : ""}">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(value)}</strong>
    </div>
  `;
}

function renderLine(line) {
  const quantityText = `${formatQuantity(line.scaledQuantity)} × ${formatMoney(Math.round(line.unitPrice))}`;

  return `
    <div class="seed-line ${line.tone ? `is-${escapeHTML(line.tone)}` : ""}">
      <div class="seed-line__meta">
        <span>${escapeHTML(line.label)}</span>
      </div>
      <strong>${escapeHTML(quantityText)} · ${escapeHTML(formatMoney(Math.round(line.value)))}</strong>
    </div>
  `;
}

function renderSupportDetail(detail) {
  return `
    <div class="seed-line">
      <div class="seed-line__meta">
        <span>${escapeHTML(detail.label)} support</span>
      </div>
      <strong>${escapeHTML(formatQuantity(detail.characters))} chars · ${escapeHTML(formatQuantity(detail.berryCount))} berries</strong>
    </div>
  `;
}

export function renderLeppaHeroSummary(scenario) {
  const bestDaily = scenario.bestRoute
    ? `${scenario.bestRoute.label} · ${formatSignedMoney(Math.round(scenario.bestRoute.dailyValue))}`
    : "No routes";
  const lowestBuy = scenario.lowestBuyRoute
    ? `${scenario.lowestBuyRoute.shortLabel} · ${formatMoney(Math.round(scenario.lowestBuyRoute.totalBuyValue))}`
    : "No routes";

  return `
    <span class="hero-pill">${escapeHTML(String(scenario.characters))} character baseline</span>
    <span class="hero-pill">Rhythm · ${escapeHTML(scenario.state.rhythmMode === "flow" ? "Flow" : "Normal")}</span>
    <span class="hero-pill">${escapeHTML(String(scenario.profitableCount))} profitable</span>
    <span class="hero-pill">Best · ${escapeHTML(bestDaily)}</span>
    <span class="hero-pill">Lowest seed buys · ${escapeHTML(lowestBuy)}</span>
  `;
}

export function renderLeppaPriceSummary(scenario) {
  const leppaSell = scenario.leppaBerry
    ? formatMoney(Math.round(scenario.routes[0]?.leppaSellPrice ?? 0))
    : "—";

  const packetLabel = scenario.priceState?.packets?.leppa?.enabled
    ? `Leppa packet override active · ${formatMoney(Math.round(scenario.priceState.packets.leppa.price || 0))}`
    : "Seed buys and surplus seed sales use Prices";

  return `
    <span>Leppa sell from Prices · ${escapeHTML(leppaSell)}</span>
    <span>·</span>
    <span>${escapeHTML(packetLabel)}</span>
    <span>·</span>
    <span>${escapeHTML(scenario.state.rhythmMode === "flow" ? "Flow uses exact grow-time uptime" : "Normal uses standard day buckets")}</span>
    <span>·</span>
    <span>Harvest Tool fixed at 350</span>
  `;
}

export function renderLeppaResultsSummary(visibleCount, totalCount, sortLabel) {
  return `${visibleCount} of ${totalCount} routes · ${sortLabel}`;
}

function renderRouteBadges(route) {
  return `
    <div class="seed-badges">
      <span class="seed-badge seed-badge--method">${escapeHTML(route.familyLabel)}</span>
      <span class="seed-badge">${escapeHTML(route.rhythmLabel)} rhythm</span>
      <span class="seed-badge">${escapeHTML(formatQuantity(route.leppaCharacters))} Leppa chars</span>
      <span class="seed-badge">${escapeHTML(route.buyProfile)}</span>
      <span class="seed-badge ${route.buyPressure ? "is-warn" : "is-good"}">${route.buyPressure ? "Needs buys" : "Buy-free"}</span>
    </div>
  `;
}

export function renderLeppaRouteCards(routes, bestRouteId = "") {
  if (!routes.length) {
    return `
      <div class="empty-state">
        <p><strong>No Leppa routes match the current filters.</strong></p>
        <p class="muted">Try clearing the search or switching back to all route families.</p>
      </div>
    `;
  }

  return routes
    .map((route) => {
      const isBest = route.routeKey === bestRouteId;
      const dailyTone = route.dailyValue < 0 ? "is-negative" : "";

      return `
      <article
        class="seed-route-card ${isBest ? "is-best" : ""}"
        data-leppa-route-details="${escapeHTML(route.routeKey)}"
        tabindex="0"
        role="button"
        aria-label="Open ${escapeHTML(route.label)} details"
      >
        <div class="seed-route-card__top">
          <div class="seed-route-card__icon-wrap">
            <img class="seed-route-card__berry" src="../assets/img/berries/leppa.png" alt="Leppa berry sprite">
          </div>

          <div class="seed-route-card__identity">
            <p class="eyebrow">${escapeHTML(route.shortLabel)}</p>
            <h3>${escapeHTML(route.label)}</h3>
            <p class="seed-route-card__family">${escapeHTML(route.summary)}</p>
          </div>

          <div class="seed-route-card__daily ${dailyTone}">
            <span>Daily</span>
            <strong>${escapeHTML(formatSignedMoney(Math.round(route.dailyValue)))}</strong>
          </div>
        </div>

        ${renderRouteBadges(route)}

        <div class="seed-preview-stats">
          ${renderPreviewStat("Leppas / day", formatQuantity(route.leppaOutput.total))}
          ${renderPreviewStat("Seed buys", formatMoney(Math.round(route.totalBuyValue)), route.totalBuyValue > 0 ? "negative" : "default")}
          ${renderPreviewStat("Tools used", formatQuantity(route.toolsUsed), route.toolsUsed > 0 ? "default" : "negative")}
        </div>

        <p class="toolbar-note">${escapeHTML(route.supportSummary)}</p>
        <p class="seed-route-card__note">Open details for the full formula and cost lines.</p>
      </article>
    `;
    })
    .join("");
}

export function renderLeppaModal(route) {
  return `
    <div class="modal-layout seed-modal-layout">
      <div class="modal-hero seed-modal-hero">
        <div class="modal-hero__icon-wrap">
          <img
            class="modal-headline__icon"
            src="../assets/img/berries/leppa.png"
            alt="Leppa berry sprite"
            width="72"
            height="72"
          >
        </div>

        <div class="modal-headline__copy">
          <p class="eyebrow">${escapeHTML(route.familyLabel)}</p>
          <h3 id="modal-title">${escapeHTML(route.label)}</h3>
          <p class="modal-headline__effect">${escapeHTML(route.summary)}</p>
        </div>

        <div class="modal-price ${route.dailyValue < 0 ? "is-negative" : ""}">
          ${escapeHTML(formatSignedMoney(Math.round(route.dailyValue)))}
        </div>
      </div>

      <div class="modal-grid seed-modal-grid">
        <section class="modal-panel modal-panel--facts">
          <h4>Quick facts</h4>
          <div class="detail-list detail-list--cards">
            ${renderMetric("Characters", formatNumber(route.characters))}
            ${renderMetric("Leppa chars", formatQuantity(route.leppaCharacters))}
            ${renderMetric("Support chars", formatQuantity(route.supportCharacters))}
            ${renderMetric("Rhythm", route.rhythmLabel)}
            ${renderMetric("Leppa sell", formatMoney(Math.round(route.leppaSellPrice)))}
            ${renderMetric("Leppas / day", formatQuantity(route.leppaOutput.total))}
            ${renderMetric("Buy profile", route.buyProfile)}
          </div>
        </section>

        <section class="modal-panel modal-panel--facts">
          <h4>Profit breakdown</h4>
          <div class="detail-list detail-list--cards">
            ${renderMetric("Revenue", formatMoney(Math.round(route.totalRevenue)))}
            ${renderMetric("Costs", formatMoney(Math.round(route.totalCost)), "negative")}
            ${renderMetric("Seed sales", formatMoney(Math.round(route.soldSeedValue)))}
            ${renderMetric("Seed buys", formatMoney(Math.round(route.boughtSeedValue)), route.boughtSeedValue > 0 ? "negative" : "default")}
            ${renderMetric("Tool cost", formatMoney(Math.round(route.toolCost)), route.toolCost > 0 ? "negative" : "default")}
            ${renderMetric("Daily", formatSignedMoney(Math.round(route.dailyValue)), route.dailyValue < 0 ? "negative" : "default")}
          </div>
        </section>

        <section class="modal-panel">
          <h4>Daily support mix</h4>
          <div class="seed-line-list">
            ${route.supportDetails.length ? route.supportDetails.map(renderSupportDetail).join("") : '<p class="toolbar-note">This route buys everything and does not run support berries.</p>'}
          </div>
        </section>

        <section class="modal-panel">
          <h4>Revenue lines</h4>
          <div class="seed-line-list">
            ${route.revenueLines.map(renderLine).join("")}
          </div>
        </section>

        <section class="modal-panel">
          <h4>Cost lines</h4>
          <div class="seed-line-list">
            ${route.costLines.map(renderLine).join("")}
          </div>
        </section>

        <section class="modal-panel">
          <h4>Assumptions</h4>
          <div class="stack-sm">
            <p class="toolbar-note">${escapeHTML(route.assumptionNote)}</p>
            <p class="toolbar-note">This page uses normalized one-character/day baselines. It is meant as the clean starting point before adding human rhythm systems.</p>
            <p class="toolbar-note">Seed output uses the validated flavor-point model: 1 berry becomes 1 seed, 1-point flavors are plain-only, and 2+ point flavors split 70% plain / 30% very.</p>
            <p class="toolbar-note">Advanced routes like Starf pipelines, 16h flow, and buffer correction can be added later on top of this baseline.</p>
          </div>
        </section>
      </div>
    </div>
  `;
}
