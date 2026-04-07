// assets/js/modules/leppa/app.js
// v2.0.0-beta
// Page wiring for the Leppa planner page, route filters, cards, and detail modal.
import { select } from "../dom.js";
import { DEFAULT_LEPPA_CHARACTERS } from "./data.js";
import { getLeppaScenario } from "./logic.js";
import {
  renderLeppaHeroSummary,
  renderLeppaModal,
  renderLeppaPriceSummary,
  renderLeppaResultsSummary,
  renderLeppaRouteCards,
} from "./render.js";

const SORT_LABELS = {
  "daily-desc": "Daily value",
  "cycle-desc": "Cycle value",
  "leppa-desc": "Leppa output",
  "name-asc": "Name",
};

export function initLeppaApp() {
  const nodes = {
    heroSummary: select("#leppa-hero-summary"),
    priceSummary: select("#leppa-price-summary"),
    resultsSummary: select("#leppa-results-summary"),
    characters: select("#leppa-characters"),
    visibility: select("#leppa-show"),
    family: select("#leppa-family"),
    sort: select("#leppa-sort"),
    search: select("#leppa-search"),
    results: select("#leppa-route-results"),
    modal: select("#leppa-route-modal"),
    modalContent: select("#leppa-route-modal-content"),
    modalClose: select("#leppa-route-modal-close"),
  };

  if (Object.values(nodes).some((node) => node === null)) {
    return;
  }

  let state = {
    characters: DEFAULT_LEPPA_CHARACTERS,
    visibility: "all",
    family: "all",
    sort: "daily-desc",
    search: "",
  };

  function syncFields() {
    nodes.characters.value = String(state.characters);
    nodes.visibility.value = state.visibility;
    nodes.family.value = state.family;
    nodes.sort.value = state.sort;
    nodes.search.value = state.search;
  }

  function getScenario() {
    return getLeppaScenario(state);
  }

  function render() {
    syncFields();
    const scenario = getScenario();
    nodes.heroSummary.innerHTML = renderLeppaHeroSummary(scenario);
    nodes.priceSummary.innerHTML = renderLeppaPriceSummary(scenario);
    nodes.resultsSummary.textContent = renderLeppaResultsSummary(
      scenario.visibleRoutes.length,
      scenario.totalCount,
      SORT_LABELS[state.sort],
    );
    nodes.results.innerHTML = renderLeppaRouteCards(
      scenario.visibleRoutes,
      scenario.bestRoute?.routeKey ?? "",
    );
  }

  function updateState() {
    state = {
      characters: Number(nodes.characters.value) || DEFAULT_LEPPA_CHARACTERS,
      visibility: nodes.visibility.value,
      family: nodes.family.value,
      sort: nodes.sort.value,
      search: nodes.search.value.trim(),
    };

    render();
  }

  function closeModal() {
    nodes.modal.classList.remove("is-open");
    nodes.modal.setAttribute("aria-hidden", "true");
  }

  function openModal(routeKey) {
    const scenario = getScenario();
    const route = scenario.routes.find((entry) => entry.routeKey === routeKey);

    if (!route) {
      return;
    }

    nodes.modalContent.innerHTML = renderLeppaModal(route);
    nodes.modal.classList.add("is-open");
    nodes.modal.setAttribute("aria-hidden", "false");
  }

  render();

  [nodes.characters, nodes.visibility, nodes.family, nodes.sort, nodes.search].forEach((node) => {
    node.addEventListener("input", updateState);
    node.addEventListener("change", updateState);
  });

  nodes.results.addEventListener("click", (event) => {
    const card = event.target.closest("[data-leppa-route-details]");

    if (card) {
      openModal(card.dataset.leppaRouteDetails);
    }
  });

  nodes.results.addEventListener("keydown", (event) => {
    const card = event.target.closest("[data-leppa-route-details]");

    if (card && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openModal(card.dataset.leppaRouteDetails);
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

  window.addEventListener("storage", render);
}
