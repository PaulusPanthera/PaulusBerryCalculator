// assets/js/modules/powder/app.js
// v2.0.0-beta
// Page wiring for powder target selection, filters, cards, and detail modal.
import { select } from "../dom.js";
import { POWDER_TARGETS } from "./data.js";
import { getPowderScenario } from "./logic.js";
import {
  renderPowderHeroSummary,
  renderPowderModal,
  renderPowderPriceSummary,
  renderPowderResultsSummary,
  renderPowderRouteCards,
} from "./render.js";

const SORT_LABELS = {
  "daily-desc": "Daily value",
  "name-asc": "Name",
  "cost-asc": "Total cost",
  "yield-desc": "Item yield",
};

export function initPowderApp() {
  const nodes = {
    heroSummary: select("#powder-hero-summary"),
    priceSummary: select("#powder-price-summary"),
    resultsSummary: select("#powder-results-summary"),
    target: select("#powder-target"),
    search: select("#powder-search"),
    characters: select("#powder-characters"),
    visibility: select("#powder-show"),
    standardDays: select("#powder-days"),
    sort: select("#powder-sort"),
    results: select("#powder-route-results"),
    modal: select("#powder-route-modal"),
    modalContent: select("#powder-route-modal-content"),
    modalClose: select("#powder-route-modal-close"),
  };

  if (Object.values(nodes).some((node) => node === null)) return;

  let state = {
    targetId: "pp-max",
    search: "",
    characters: 1,
    visibility: "all",
    standardDays: "all",
    sort: "daily-desc",
  };

  nodes.target.innerHTML = POWDER_TARGETS.map(
    (target) => `<option value="${target.id}">${target.label}</option>`,
  ).join("");

  function syncFields() {
    nodes.target.value = state.targetId;
    nodes.search.value = state.search;
    nodes.characters.value = String(state.characters);
    nodes.visibility.value = state.visibility;
    nodes.standardDays.value = state.standardDays;
    nodes.sort.value = state.sort;
  }

  function getScenario() {
    return getPowderScenario(state);
  }

  function render() {
    syncFields();
    const scenario = getScenario();
    nodes.heroSummary.innerHTML = renderPowderHeroSummary(scenario.target, scenario);
    nodes.priceSummary.innerHTML = renderPowderPriceSummary(scenario.target);
    nodes.resultsSummary.textContent = renderPowderResultsSummary(
      scenario.visibleRoutes.length,
      scenario.totalCount,
      SORT_LABELS[state.sort],
    );
    nodes.results.innerHTML = renderPowderRouteCards(scenario.target, scenario.visibleRoutes);
  }

  function closeModal() {
    nodes.modal.classList.remove("is-open");
    nodes.modal.setAttribute("aria-hidden", "true");
  }

  function openModal(routeKey) {
    const scenario = getScenario();
    const route = scenario.visibleRoutes.find((entry) => entry.routeKey === routeKey);
    if (!route) return;
    nodes.modalContent.innerHTML = renderPowderModal(route);
    nodes.modal.classList.add("is-open");
    nodes.modal.setAttribute("aria-hidden", "false");
  }

  function updateState() {
    state = {
      targetId: nodes.target.value,
      search: nodes.search.value.trim(),
      characters: Number(nodes.characters.value) || 1,
      visibility: nodes.visibility.value,
      standardDays: nodes.standardDays.value,
      sort: nodes.sort.value,
    };
    render();
  }

  render();

  [
    nodes.target,
    nodes.search,
    nodes.characters,
    nodes.visibility,
    nodes.standardDays,
    nodes.sort,
  ].forEach((node) => {
    node.addEventListener("input", updateState);
    node.addEventListener("change", updateState);
  });

  nodes.results.addEventListener("click", (event) => {
    const card = event.target.closest("[data-powder-route-details]");
    if (card) openModal(card.dataset.powderRouteDetails);
  });

  nodes.results.addEventListener("keydown", (event) => {
    const card = event.target.closest("[data-powder-route-details]");
    if (card && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openModal(card.dataset.powderRouteDetails);
    }
  });

  nodes.modal.addEventListener("click", (event) => {
    const shouldClose =
      event.target.closest('[data-close-modal="true"]') || event.target === nodes.modalClose;
    if (shouldClose) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nodes.modal.classList.contains("is-open")) closeModal();
  });
}
