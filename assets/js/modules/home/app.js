// assets/js/modules/home/app.js
// v2.0.0-beta
// Home dashboard wiring for top routes, breakpoints, quick links, and current price-source summaries.
import { BERRIES } from "../catalog/data.js";
import { getSeedHarvestSummary } from "../catalog/logic.js";
import { select } from "../dom.js";
import { escapeHTML, formatMoney, formatSignedMoney, formatHours } from "../format.js";
import { getBerryRouteScenario } from "../berries/logic.js";
import { getLeppaScenario } from "../leppa/logic.js";
import { FLAVOR_META, FLAVOR_ORDER } from "../pricing/defaults.js";
import { getPriceState } from "../pricing/store.js";
import { POWDER_TARGETS } from "../powder/data.js";
import { getPowderScenario } from "../powder/logic.js";
import { getSeedScenario, getSeedStateFromInputs } from "../seeds/logic.js";

const DEFAULT_VERY_RATE = 30;
const DEFAULT_CHARACTERS = 1;
const DEFAULT_LEPPA_CHARACTERS = 9;
const DEFAULT_POWDER_TARGET_ID = "pp-max";

function getBerrySprite(slug) {
  return `assets/img/berries/${slug}.png`;
}

function getSeedRoutes() {
  return FLAVOR_ORDER.flatMap((flavor) => {
    const scenario = getSeedScenario(
      getSeedStateFromInputs({
        flavor,
        characters: DEFAULT_CHARACTERS,
        veryRatePercent: DEFAULT_VERY_RATE,
        sort: "daily-desc",
        visibility: "all",
        orientation: "all",
        dayBucket: "all",
      }),
    );

    return scenario.allGroups.map((group) => ({
      ...group.activeRoute,
      flavor,
      flavorLabel: FLAVOR_META[flavor]?.label || flavor,
    }));
  }).sort((left, right) => right.dailyValue - left.dailyValue);
}

function getBerryRoutes() {
  const scenario = getBerryRouteScenario({
    characters: DEFAULT_CHARACTERS,
    visibility: "all",
    method: "all",
    standardDays: "all",
    sort: "daily-desc",
    search: "",
    activeMethods: {},
    veryRatePercent: DEFAULT_VERY_RATE,
  });

  return scenario.visibleGroups.map((group) => group.activeRoute);
}

function getBreakpointRoutes(priceState) {
  return BERRIES.map((berry) => ({
    berry,
    summary: getSeedHarvestSummary(berry, priceState),
  })).sort((left, right) => right.summary.currentEdge - left.summary.currentEdge);
}

function getSourceSummary(priceState) {
  const syncLabel = priceState?.autoPricing?.lastSyncAt
    ? `Last sync ${new Date(priceState.autoPricing.lastSyncAt).toLocaleString()}`
    : "No auto sync yet";

  return [
    `Seeds · ${priceState?.seeds?.mode || "manual"}`,
    `Berries · ${priceState?.berries?.mode || "vendor"}`,
    `Powder sell · ${priceState?.powder?.targetMode || "manual"}`,
    `Powder extras · ${priceState?.powder?.ingredientMode || "manual"}`,
    `Powder berry buys · ${priceState?.powder?.berryMode || "vendor"}`,
    syncLabel,
  ];
}

function renderSummaryPills(target, priceState, seedRoutes, berryRoutes, leppaRoute, powderRoute) {
  const breakpointCount = getBreakpointRoutes(priceState).filter(
    (entry) => entry.summary.currentEdge > 0.001,
  ).length;
  const topSeed = seedRoutes[0];
  const topBerry = berryRoutes[0];
  const pills = [
    `Best seed · ${topSeed?.shortName || "—"} ${topSeed ? formatSignedMoney(Math.round(topSeed.dailyValue)) : ""}`,
    `Best berry · ${topBerry?.shortName || "—"} ${topBerry ? formatSignedMoney(Math.round(topBerry.dailyValue)) : ""}`,
    `Best Leppa · ${leppaRoute?.label || "—"}`,
    `Best powder · ${powderRoute?.berry?.shortName || "—"}`,
    `${breakpointCount} buy-and-tool wins`,
  ];

  target.innerHTML = pills
    .map((label) => `<span class="hero-pill">${escapeHTML(label)}</span>`)
    .join("");
}

function renderSourcePills(target, sourceSummary) {
  target.innerHTML = sourceSummary
    .map((label) => `<span class="hero-pill">${escapeHTML(label)}</span>`)
    .join("");
}

function renderQuickLinks(target) {
  const cards = [
    {
      href: "pages/shop.html",
      title: "Update Prices",
      copy: "Switch vendor, manual, and auto sources before you judge any route.",
    },
    {
      href: "pages/shopping.html",
      title: "Build a Shopping List",
      copy: "Turn route ideas into one combined seed basket and subtract your bag stock.",
    },
    {
      href: "pages/guide.html",
      title: "Open the Guide",
      copy: "Read the berry basics, timing buckets, routine notes, and practical farming tips.",
    },
    {
      href: "pages/berrydex.html",
      title: "Browse BerryDex",
      copy: "Check recipes, grow times, vendor values, and deeper seed-harvest breakpoints.",
    },
  ];

  target.innerHTML = cards
    .map(
      (card) => `
        <a class="home-link-card" href="${card.href}">
          <strong>${escapeHTML(card.title)}</strong>
          <span>${escapeHTML(card.copy)}</span>
        </a>
      `,
    )
    .join("");
}

function renderSeedRoutes(target, routes) {
  target.innerHTML = routes
    .slice(0, 5)
    .map(
      (route, index) => `
        <a class="home-route-row" href="pages/seeds.html">
          <div class="home-route-row__media">
            <span class="home-rank">#${index + 1}</span>
            <img src="${escapeHTML(getBerrySprite(route.slug))}" alt="${escapeHTML(route.shortName)} berry sprite">
            <div class="home-route-row__copy">
              <strong>${escapeHTML(route.shortName)}</strong>
              <span>${escapeHTML(route.flavorLabel)} · ${escapeHTML(route.methodLabel)} · ${escapeHTML(route.shareLabel)}</span>
            </div>
          </div>
          <div class="home-route-row__value ${route.dailyValue < 0 ? "is-negative" : ""}">
            <span>Daily</span>
            <strong>${escapeHTML(formatSignedMoney(Math.round(route.dailyValue)))}</strong>
          </div>
        </a>
      `,
    )
    .join("");
}

function renderBerryRoutes(target, routes) {
  target.innerHTML = routes
    .slice(0, 5)
    .map(
      (route, index) => `
        <a class="home-route-row" href="pages/berries.html">
          <div class="home-route-row__media">
            <span class="home-rank">#${index + 1}</span>
            <img src="${escapeHTML(getBerrySprite(route.berrySlug))}" alt="${escapeHTML(route.shortName)} berry sprite">
            <div class="home-route-row__copy">
              <strong>${escapeHTML(route.shortName)}</strong>
              <span>${escapeHTML(route.methodLabel)} · ${escapeHTML(formatHours(route.growthHours))} · ${escapeHTML(route.standardDays)} day standard</span>
            </div>
          </div>
          <div class="home-route-row__value ${route.dailyValue < 0 ? "is-negative" : ""}">
            <span>Daily</span>
            <strong>${escapeHTML(formatSignedMoney(Math.round(route.dailyValue)))}</strong>
          </div>
        </a>
      `,
    )
    .join("");
}

function renderBreakpointRoutes(target, entries) {
  target.innerHTML = entries
    .slice(0, 5)
    .map(
      ({ berry, summary }, index) => `
        <a class="home-route-row" href="pages/berrydex.html">
          <div class="home-route-row__media">
            <span class="home-rank">#${index + 1}</span>
            <img src="${escapeHTML(getBerrySprite(berry.slug))}" alt="${escapeHTML(berry.shortName)} berry sprite">
            <div class="home-route-row__copy">
              <strong>${escapeHTML(berry.shortName)}</strong>
              <span>${escapeHTML(summary.isWorthBuying ? "Worth buying + tooling" : "Still below break-even")} · Break-even ${escapeHTML(formatMoney(Math.round(summary.breakEvenBerryBuy)))}</span>
            </div>
          </div>
          <div class="home-route-row__value ${summary.currentEdge < 0 ? "is-negative" : ""}">
            <span>Edge</span>
            <strong>${escapeHTML(formatSignedMoney(Math.round(summary.currentEdge)))}</strong>
          </div>
        </a>
      `,
    )
    .join("");
}

function renderLeppaSummary(target, route) {
  target.innerHTML = route
    ? `
      <a class="home-feature-card" href="pages/leppa.html">
        <span class="eyebrow">Best current route</span>
        <h3>${escapeHTML(route.label)}</h3>
        <p class="home-note">${escapeHTML(route.summary)}</p>
        <div class="home-feature-metrics">
          <div>
            <span>Daily value</span>
            <strong>${escapeHTML(formatSignedMoney(Math.round(route.dailyValue)))}</strong>
          </div>
          <div>
            <span>Total buy pressure</span>
            <strong>${escapeHTML(formatMoney(Math.round(route.totalBuyValue)))}</strong>
          </div>
        </div>
      </a>
    `
    : '<div class="empty-state"><p>No Leppa route available.</p></div>';
}

function renderPowderTargetOptions(target, activeId) {
  target.innerHTML = POWDER_TARGETS.map(
    (powderTarget) =>
      `<option value="${powderTarget.id}"${powderTarget.id === activeId ? " selected" : ""}>${escapeHTML(powderTarget.label)}</option>`,
  ).join("");
}

function renderPowderRoutes(target, targetLabel, routes) {
  target.innerHTML = routes
    .slice(0, 4)
    .map(
      (route, index) => `
        <a class="home-route-row" href="pages/powder.html">
          <div class="home-route-row__media">
            <span class="home-rank">#${index + 1}</span>
            <img src="${escapeHTML(getBerrySprite(route.berry.slug))}" alt="${escapeHTML(route.berry.shortName)} berry sprite">
            <div class="home-route-row__copy">
              <strong>${escapeHTML(route.berry.shortName)}</strong>
              <span>${escapeHTML(targetLabel)} · ${escapeHTML(formatHours(route.berry.growthHours))} · ${escapeHTML(route.standardDays)} day standard</span>
            </div>
          </div>
          <div class="home-route-row__value ${route.dailyValue < 0 ? "is-negative" : ""}">
            <span>Daily</span>
            <strong>${escapeHTML(formatSignedMoney(Math.round(route.dailyValue)))}</strong>
          </div>
        </a>
      `,
    )
    .join("");
}

export function initHomeApp() {
  const nodes = {
    summary: select("#home-summary"),
    sourceSummary: select("#home-source-summary"),
    quickLinks: select("#home-quick-links"),
    seedResults: select("#home-seed-results"),
    berryResults: select("#home-berry-results"),
    leppaBest: select("#home-leppa-best"),
    powderTarget: select("#home-powder-target"),
    powderResults: select("#home-powder-results"),
    breakpointResults: select("#home-breakpoint-results"),
  };

  if (Object.values(nodes).some((node) => node === null)) {
    return;
  }

  const priceState = getPriceState();
  const seedRoutes = getSeedRoutes();
  const berryRoutes = getBerryRoutes();
  const leppaScenario = getLeppaScenario({
    characters: DEFAULT_LEPPA_CHARACTERS,
    visibility: "all",
    family: "all",
    sort: "daily-desc",
    search: "",
  });
  const breakpointRoutes = getBreakpointRoutes(priceState);
  let activePowderTarget = DEFAULT_POWDER_TARGET_ID;

  renderQuickLinks(nodes.quickLinks);
  renderSourcePills(nodes.sourceSummary, getSourceSummary(priceState));
  renderSeedRoutes(nodes.seedResults, seedRoutes);
  renderBerryRoutes(nodes.berryResults, berryRoutes);
  renderLeppaSummary(nodes.leppaBest, leppaScenario.bestRoute);
  renderBreakpointRoutes(nodes.breakpointResults, breakpointRoutes);
  renderPowderTargetOptions(nodes.powderTarget, activePowderTarget);

  function renderPowderBoard() {
    const scenario = getPowderScenario({
      targetId: activePowderTarget,
      characters: DEFAULT_CHARACTERS,
      search: "",
      visibility: "all",
      standardDays: "all",
      sort: "daily-desc",
    });

    renderPowderRoutes(nodes.powderResults, scenario.target.label, scenario.visibleRoutes);
    renderSummaryPills(
      nodes.summary,
      priceState,
      seedRoutes,
      berryRoutes,
      leppaScenario.bestRoute,
      scenario.visibleRoutes[0] ?? null,
    );
  }

  nodes.powderTarget.addEventListener("change", () => {
    activePowderTarget = nodes.powderTarget.value;
    renderPowderBoard();
  });

  renderPowderBoard();
}
