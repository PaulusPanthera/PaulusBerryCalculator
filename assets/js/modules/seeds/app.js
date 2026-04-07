// assets/js/modules/seeds/app.js
// v2.0.0-beta
// Seeds page wiring for flavor-first route comparison.
import { select } from "../dom.js";
import { DEFAULT_VERY_RATE_PERCENT, FLAVOR_TABS } from "./data.js";
import { getSeedScenario, getSeedStateFromInputs } from "./logic.js";
import {
  renderSeedFlavorTabs,
  renderSeedHeroSummary,
  renderSeedModalContent,
  renderSeedPriceSummary,
  renderSeedResultsSummary,
  renderSeedRoutes,
} from "./render.js";

const SORT_LABELS = {
  "daily-desc": "Daily · high to low",
  "cycle-desc": "Cycle · high to low",
  "selected-desc": "Selected seeds · high to low",
  "growth-asc": "Grow time · fastest first",
};

function readValues(nodes, activeFlavor) {
  return {
    flavor: activeFlavor,
    characters: nodes.characters.value,
    veryRatePercent: nodes.veryRate.value,
    valuation: nodes.valuation.value,
    sort: nodes.sort.value,
    visibility: nodes.visibility.value,
    orientation: nodes.orientation.value,
    dayBucket: nodes.dayBucket.value,
  };
}

function closeModal(modalNode) {
  modalNode.classList.remove("is-open");
  modalNode.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function openModal(modalNode, contentNode, group, flavor) {
  renderSeedModalContent(contentNode, group, flavor);
  modalNode.classList.add("is-open");
  modalNode.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

export function initSeedApp() {
  const nodes = {
    flavorTabs: select("#seed-flavor-tabs"),
    characters: select("#seed-characters"),
    veryRate: select("#seed-very-rate"),
    valuation: select("#seed-valuation"),
    sort: select("#seed-sort"),
    visibility: select("#seed-visibility"),
    orientation: select("#seed-orientation"),
    dayBucket: select("#seed-day-bucket"),
    heroSummary: select("#seed-hero-summary"),
    priceSummary: select("#seed-price-summary"),
    resultsSummary: select("#seed-results-summary"),
    routes: select("#seed-route-results"),
    modal: select("#seed-route-modal"),
    modalContent: select("#seed-route-modal-content"),
    modalClose: select("#seed-route-modal-close"),
  };

  if (Object.values(nodes).some((node) => node === null)) {
    return;
  }

  let activeFlavor = "all";
  let methodSelections = {};
  let latestScenario = null;
  nodes.characters.value = "1";
  nodes.veryRate.value = String(DEFAULT_VERY_RATE_PERCENT);
  nodes.valuation.value = "sell";

  function rerender() {
    const state = getSeedStateFromInputs(readValues(nodes, activeFlavor));
    const scenario = getSeedScenario(state, methodSelections);

    latestScenario = scenario;
    nodes.characters.value = String(state.characters);
    nodes.veryRate.value = String(state.veryRatePercent);

    renderSeedFlavorTabs(nodes.flavorTabs, FLAVOR_TABS, activeFlavor);
    renderSeedHeroSummary(nodes.heroSummary, scenario);
    renderSeedPriceSummary(nodes.priceSummary, scenario);
    renderSeedResultsSummary(
      nodes.resultsSummary,
      scenario.groups.length,
      scenario.allGroups.length,
      SORT_LABELS[state.sort],
      state.valuation,
    );
    renderSeedRoutes(nodes.routes, scenario);
  }

  function openRouteFromTrigger(trigger) {
    if (!trigger || !latestScenario) {
      return;
    }

    const routeKey = trigger.dataset.routeDetails;
    const group = latestScenario.allGroups.find((entry) => entry.activeRoute.routeKey === routeKey);

    if (!group) {
      return;
    }

    openModal(nodes.modal, nodes.modalContent, group, activeFlavor);
  }

  rerender();

  nodes.flavorTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-flavor-tab]");

    if (!button) {
      return;
    }

    activeFlavor = button.dataset.flavorTab;
    rerender();
  });

  nodes.routes.addEventListener("click", (event) => {
    const methodButton = event.target.closest("[data-route-method][data-route-slug]");

    if (methodButton) {
      methodSelections[methodButton.dataset.routeSlug] = methodButton.dataset.routeMethod;
      rerender();
      return;
    }

    const card = event.target.closest("[data-route-details]");
    openRouteFromTrigger(card);
  });

  nodes.routes.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const card = event.target.closest("[data-route-details]");

    if (!card || event.target.closest("[data-route-method][data-route-slug]")) {
      return;
    }

    event.preventDefault();
    openRouteFromTrigger(card);
  });

  nodes.characters.addEventListener("input", rerender);
  nodes.veryRate.addEventListener("input", rerender);
  nodes.valuation.addEventListener("change", rerender);
  nodes.sort.addEventListener("change", rerender);
  nodes.visibility.addEventListener("change", rerender);
  nodes.orientation.addEventListener("change", rerender);
  nodes.dayBucket.addEventListener("change", rerender);

  nodes.modal.addEventListener("click", (event) => {
    if (event.target.closest('[data-close-modal="true"]')) {
      closeModal(nodes.modal);
    }
  });

  nodes.modalClose.addEventListener("click", () => {
    closeModal(nodes.modal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nodes.modal.classList.contains("is-open")) {
      closeModal(nodes.modal);
    }
  });

  window.addEventListener("storage", rerender);
}
