// assets/js/modules/app.js
// v2.0.0-beta
// Page wiring for the berry catalog: filters, rendering, summaries, and modal lifecycle.
import { select } from "./dom.js";
import { BERRIES } from "./catalog/data.js";
import {
  applyCatalogState,
  getBerryBySlug,
  getCatalogOptions,
  getHeroSummary,
  getSeedHarvestSummary,
} from "./catalog/logic.js";
import {
  renderCatalog,
  renderFlavorLegend,
  renderHeroSummary,
  renderModalContent,
  renderResultsSummary,
  renderSelectOptions,
} from "./catalog/render.js";

const SORT_LABELS = {
  "name-asc": "Name · A → Z",
  "vendor-desc": "Vendor · high to low",
  "growth-asc": "Grow time · fastest",
  "yield-desc": "Yield · highest",
};

function getInitialState() {
  return {
    query: "",
    category: "all",
    growth: "all",
    flavor: "all",
    sort: "name-asc",
  };
}

function populateControls(options, nodes) {
  renderSelectOptions(nodes.category, ["all", ...options.categories], (option) =>
    option === "all" ? "All categories" : option,
  );

  renderSelectOptions(nodes.growth, ["all", ...options.growthHours], (option) =>
    option === "all" ? "All grow times" : `${option}h`,
  );

  renderSelectOptions(nodes.flavor, ["all", ...options.flavors], (option) =>
    option === "all" ? "All seed flavors" : `${option[0].toUpperCase()}${option.slice(1)}`,
  );
}

function syncStateFromControls(state, nodes) {
  state.query = nodes.search.value.trim();
  state.category = nodes.category.value;
  state.growth = nodes.growth.value;
  state.flavor = nodes.flavor.value;
  state.sort = nodes.sort.value;
}

function resetControls(nodes) {
  nodes.search.value = "";
  nodes.category.value = "all";
  nodes.growth.value = "all";
  nodes.flavor.value = "all";
  nodes.sort.value = "name-asc";
}

function closeModal(modalNode) {
  modalNode.classList.remove("is-open");
  modalNode.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function openModal(modalNode, contentNode, berry) {
  renderModalContent(contentNode, berry, getSeedHarvestSummary(berry));
  modalNode.classList.add("is-open");
  modalNode.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

export function initBerryApp() {
  const nodes = {
    search: select("#berry-search"),
    category: select("#category-filter"),
    growth: select("#growth-filter"),
    flavor: select("#flavor-filter"),
    sort: select("#sort-filter"),
    clear: select("#clear-filters"),
    results: select("#berry-results"),
    heroSummary: select("#hero-summary"),
    resultsSummary: select("#results-summary"),
    legend: select("#seed-legend"),
    modal: select("#berry-modal"),
    modalContent: select("#modal-content"),
    modalClose: select("#modal-close"),
  };

  if (Object.values(nodes).some((node) => node === null)) {
    return;
  }

  const state = getInitialState();
  const options = getCatalogOptions(BERRIES);

  populateControls(options, nodes);
  renderHeroSummary(nodes.heroSummary, getHeroSummary(BERRIES));
  if (nodes.legend) {
    nodes.legend.innerHTML = renderFlavorLegend();
  }

  function rerender() {
    syncStateFromControls(state, nodes);
    const visibleBerries = applyCatalogState(BERRIES, state);

    renderCatalog(nodes.results, visibleBerries);
    renderResultsSummary(
      nodes.resultsSummary,
      visibleBerries.length,
      BERRIES.length,
      SORT_LABELS[state.sort],
    );
  }

  rerender();

  nodes.search.addEventListener("input", rerender);
  nodes.category.addEventListener("change", rerender);
  nodes.growth.addEventListener("change", rerender);
  nodes.flavor.addEventListener("change", rerender);
  nodes.sort.addEventListener("change", rerender);

  nodes.clear.addEventListener("click", () => {
    resetControls(nodes);
    rerender();
  });

  function openBerryFromTrigger(trigger) {
    if (!trigger) {
      return;
    }

    const berry = getBerryBySlug(BERRIES, trigger.dataset.berryDetails);

    if (!berry) {
      return;
    }

    openModal(nodes.modal, nodes.modalContent, berry);
  }

  nodes.results.addEventListener("click", (event) => {
    const card = event.target.closest(".catalog-card[data-berry-details]");

    openBerryFromTrigger(card);
  });

  nodes.results.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const card = event.target.closest(".catalog-card[data-berry-details]");

    if (!card) {
      return;
    }

    event.preventDefault();
    openBerryFromTrigger(card);
  });

  nodes.modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal='true']")) {
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
}
