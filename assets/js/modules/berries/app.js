// assets/js/modules/berries/app.js
// v2.0.0-beta
// Page wiring for Berry Routes filters, method switching, summary pills, and detail modal.
import { select } from "../dom.js";
import { getBerryRouteScenario } from "./logic.js";
import {
  openBerryRouteModal,
  renderBerryHeroSummary,
  renderBerryPriceSummary,
  renderBerryResultsSummary,
  renderBerryRouteCards,
} from "./render.js";

export function initBerryRoutesApp() {
  const nodes = {
    heroSummary: select("#berry-routes-hero-summary"),
    priceSummary: select("#berry-routes-price-summary"),
    resultsSummary: select("#berry-routes-results-summary"),
    results: select("#berry-route-results"),
    controls: select("#berry-routes-controls"),
    search: select("#berry-routes-search"),
    characters: select("#berry-routes-characters"),
    visibility: select("#berry-routes-show"),
    method: select("#berry-routes-method"),
    days: select("#berry-routes-days"),
    sort: select("#berry-routes-sort"),
    modal: select("#berry-route-modal"),
    modalContent: select("#berry-route-modal-content"),
    modalClose: select("#berry-route-modal-close"),
  };

  if (Object.values(nodes).some((node) => node === null)) {
    return;
  }

  let state = {
    characters: 1,
    visibility: "all",
    method: "all",
    standardDays: "all",
    sort: "daily-desc",
    search: "",
    activeMethods: {},
  };

  function getScenario() {
    return getBerryRouteScenario(state);
  }

  function syncFields() {
    nodes.characters.value = String(state.characters);
    nodes.visibility.value = state.visibility;
    nodes.method.value = state.method;
    nodes.days.value = state.standardDays;
    nodes.sort.value = state.sort;
    nodes.search.value = state.search;
  }

  function render() {
    const scenario = getScenario();
    syncFields();
    renderBerryHeroSummary(nodes.heroSummary, scenario);
    renderBerryPriceSummary(nodes.priceSummary, scenario);
    renderBerryResultsSummary(
      nodes.resultsSummary,
      scenario.visibleGroups.length,
      scenario.totalCount,
      nodes.sort.options[nodes.sort.selectedIndex].textContent,
    );
    renderBerryRouteCards(nodes.results, scenario.visibleGroups);
    return scenario;
  }

  function closeModal() {
    nodes.modal.classList.remove("is-open");
    nodes.modal.setAttribute("aria-hidden", "true");
  }

  function openModal(routeKey) {
    const scenario = getScenario();
    const group = scenario.visibleGroups.find((entry) => entry.activeRoute.routeKey === routeKey);
    if (!group) {
      return;
    }
    openBerryRouteModal(nodes.modalContent, group);
    nodes.modal.classList.add("is-open");
    nodes.modal.setAttribute("aria-hidden", "false");
  }

  render();

  nodes.controls.addEventListener("input", () => {
    state = {
      ...state,
      search: nodes.search.value.trim(),
      characters: Math.max(1, Math.min(9, Number(nodes.characters.value) || 1)),
      visibility: nodes.visibility.value,
      method: nodes.method.value,
      standardDays: nodes.days.value,
      sort: nodes.sort.value,
    };

    render();
  });

  nodes.results.addEventListener("click", (event) => {
    const methodButton = event.target.closest("[data-berry-method][data-berry-slug]");
    if (methodButton) {
      const slug = methodButton.dataset.berrySlug;
      const method = methodButton.dataset.berryMethod;
      state = {
        ...state,
        activeMethods: {
          ...state.activeMethods,
          [slug]: method,
        },
      };
      render();
      return;
    }

    const card = event.target.closest("[data-berry-route-details]");
    if (card) {
      openModal(card.dataset.berryRouteDetails);
    }
  });

  nodes.results.addEventListener("keydown", (event) => {
    const card = event.target.closest("[data-berry-route-details]");
    if (!card) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openModal(card.dataset.berryRouteDetails);
    }
  });

  nodes.modal.addEventListener("click", (event) => {
    const shouldClose =
      event.target.closest('[data-close-modal="true"]') || event.target === nodes.modalClose;
    if (shouldClose) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nodes.modal.classList.contains("is-open")) {
      closeModal();
    }
  });
}
