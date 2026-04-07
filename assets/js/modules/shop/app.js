// assets/js/modules/shop/app.js
// v2.0.0-beta
// Shop page wiring for shared seed, berry, powder, and auto-price sync controls.
import { select } from "../dom.js";
import { BERRIES } from "../catalog/data.js";
import { fetchAutoPrices, getListingFee, getNetSellFromListedPrice } from "../pricing/auto.js";
import { AUTO_SOURCE_PRESETS } from "../pricing/defaults.js";
import {
  getAutoEndpoint,
  getPriceState,
  resetPriceState,
  savePriceState,
} from "../pricing/store.js";
import {
  renderAutoSyncSummary,
  renderBerryPriceRows,
  renderPowderBerryRows,
  renderPowderIngredientCards,
  renderPowderSectionNotes,
  renderPowderTargetRows,
  renderSeedPriceCards,
  renderShopHeroSummary,
} from "./render.js";

export function initShopApp() {
  const nodes = {
    heroSummary: select("#shop-hero-summary"),
    autoSummary: select("#shop-auto-summary"),
    seedCards: select("#seed-price-cards"),
    berrySearch: select("#berry-price-search"),
    berryRows: select("#berry-price-rows"),
    resetButton: select("#shop-reset"),
    seedMode: select("#shop-seeds-mode"),
    berryMode: select("#shop-berries-mode"),
    autoSource: select("#shop-auto-source"),
    autoEndpoint: select("#shop-auto-endpoint"),
    autoSync: select("#shop-auto-sync"),
    saveStatus: select("#shop-save-status"),
    powderSummary: select("#shop-powder-summary"),
    ingredientSummary: select("#shop-ingredient-summary"),
    powderBerrySummary: select("#shop-powder-berry-summary"),
    powderTargetMode: select("#shop-powder-target-mode"),
    powderIngredientMode: select("#shop-powder-ingredient-mode"),
    powderBerryMode: select("#shop-powder-berry-mode"),
    powderTargetRows: select("#powder-target-rows"),
    powderIngredientCards: select("#powder-ingredient-cards"),
    powderBerryRows: select("#powder-berry-rows"),
    feePreviewListed: select("#shop-fee-preview-listed"),
    feePreviewFee: select("#shop-fee-preview-fee"),
    feePreviewSell: select("#shop-fee-preview-sell"),
  };

  if (Object.values(nodes).some((node) => node === null)) {
    return;
  }

  let priceState = getPriceState();

  function syncStaticFields() {
    nodes.seedMode.value = priceState.seeds.mode;
    nodes.berryMode.value = priceState.berries.mode;
    nodes.autoSource.value = priceState.autoPricing.source;
    nodes.autoEndpoint.value = priceState.autoPricing.customEndpoint;
    nodes.autoEndpoint.disabled = priceState.autoPricing.source !== "custom";
    nodes.powderTargetMode.value = priceState.powder?.targetMode || "manual";
    nodes.powderIngredientMode.value = priceState.powder?.ingredientMode || "manual";
    nodes.powderBerryMode.value = priceState.powder?.berryMode || "vendor";
  }

  function renderFeePreview() {
    const listed = 5000;
    nodes.feePreviewListed.textContent = listed.toLocaleString("en-US");
    nodes.feePreviewFee.textContent = getListingFee(listed).toLocaleString("en-US");
    nodes.feePreviewSell.textContent = getNetSellFromListedPrice(listed).toLocaleString("en-US");
  }

  function render() {
    syncStaticFields();
    renderShopHeroSummary(nodes.heroSummary, priceState);
    renderAutoSyncSummary(nodes.autoSummary, priceState);
    renderSeedPriceCards(nodes.seedCards, priceState);
    renderBerryPriceRows(nodes.berryRows, BERRIES, priceState, nodes.berrySearch.value.trim());
    renderPowderSectionNotes(
      nodes.powderSummary,
      nodes.ingredientSummary,
      nodes.powderBerrySummary,
      priceState,
    );
    renderPowderTargetRows(nodes.powderTargetRows, priceState);
    renderPowderIngredientCards(nodes.powderIngredientCards, priceState);
    renderPowderBerryRows(nodes.powderBerryRows, BERRIES, priceState);
    renderFeePreview();
  }

  function persist(message = "Saved") {
    savePriceState(priceState);
    nodes.saveStatus.textContent = message;
    window.setTimeout(() => {
      if (nodes.saveStatus.textContent === message) {
        nodes.saveStatus.textContent = "";
      }
    }, 1100);
  }

  async function syncAutoPrices() {
    const endpoint = getAutoEndpoint(priceState);

    if (!endpoint) {
      nodes.saveStatus.textContent = "Add an endpoint first";
      return;
    }

    nodes.autoSync.disabled = true;
    nodes.saveStatus.textContent = "Syncing…";

    try {
      const snapshot = await fetchAutoPrices(endpoint);
      priceState.seeds.auto = snapshot.seeds;
      priceState.berries.auto = snapshot.berries;
      priceState.powder.autoTargets = {
        ...priceState.powder.autoTargets,
        ...snapshot.powderTargets,
      };
      priceState.powder.autoIngredients = {
        ...priceState.powder.autoIngredients,
        ...snapshot.powderIngredients,
      };
      priceState.autoPricing.lastSyncAt = new Date().toISOString();
      priceState.autoPricing.lastSyncSource = priceState.autoPricing.source;
      priceState.autoPricing.lastEndpoint = endpoint;
      priceState.autoPricing.lastStatus = "success";
      priceState.autoPricing.lastError = "";
      priceState.autoPricing.matchedSeeds = snapshot.matchedSeeds;
      priceState.autoPricing.matchedBerries = snapshot.matchedBerries;
      priceState.autoPricing.matchedPowderTargets = snapshot.matchedPowderTargets;
      priceState.autoPricing.matchedPowderIngredients = snapshot.matchedPowderIngredients;
      persist("Auto prices synced");
      render();
    } catch (error) {
      priceState.autoPricing.lastStatus = "error";
      priceState.autoPricing.lastError = error instanceof Error ? error.message : "Sync failed";
      savePriceState(priceState);
      render();
      nodes.saveStatus.textContent = `Sync failed · ${priceState.autoPricing.lastError}`;
    } finally {
      nodes.autoSync.disabled = false;
    }
  }

  render();

  nodes.seedCards.addEventListener("input", (event) => {
    const input = event.target.closest("[data-seed-flavor][data-seed-type][data-price-side]");
    if (!input) return;
    const flavor = input.dataset.seedFlavor;
    const type = input.dataset.seedType;
    const side = input.dataset.priceSide;
    priceState.seeds.manual[flavor][type][side] = Number(input.value) || 0;
    persist();
  });

  nodes.berrySearch.addEventListener("input", render);

  nodes.berryRows.addEventListener("input", (event) => {
    const input = event.target.closest("[data-berry-slug][data-price-side]");
    if (!input) return;
    const slug = input.dataset.berrySlug;
    const side = input.dataset.priceSide;
    priceState.berries.manual[slug] ||= { sell: 0, buy: 0 };
    priceState.berries.manual[slug][side] = Number(input.value) || 0;
    persist();
  });

  nodes.seedMode.addEventListener("change", () => {
    priceState.seeds.mode = nodes.seedMode.value;
    persist();
    render();
  });

  nodes.berryMode.addEventListener("change", () => {
    priceState.berries.mode = nodes.berryMode.value;
    persist();
    render();
  });

  nodes.autoSource.addEventListener("change", () => {
    priceState.autoPricing.source = nodes.autoSource.value;
    if (
      priceState.autoPricing.source !== "custom" &&
      !AUTO_SOURCE_PRESETS[priceState.autoPricing.source]
    ) {
      priceState.autoPricing.source = "fiereu";
    }
    persist("Auto source saved");
    render();
  });

  nodes.autoEndpoint.addEventListener("input", () => {
    priceState.autoPricing.customEndpoint = nodes.autoEndpoint.value.trim();
    persist("Endpoint saved");
  });

  nodes.autoSync.addEventListener("click", syncAutoPrices);

  nodes.powderTargetMode.addEventListener("change", () => {
    priceState.powder.targetMode = nodes.powderTargetMode.value;
    persist("Powder sell source saved");
    render();
  });

  nodes.powderIngredientMode.addEventListener("change", () => {
    priceState.powder.ingredientMode = nodes.powderIngredientMode.value;
    persist("Powder extra source saved");
    render();
  });

  nodes.powderBerryMode.addEventListener("change", () => {
    priceState.powder.berryMode = nodes.powderBerryMode.value;
    persist("Powder berry source saved");
    render();
  });

  nodes.powderTargetRows.addEventListener("input", (event) => {
    const input = event.target.closest("[data-powder-target]");
    if (!input) return;
    const key = input.dataset.powderTarget;
    priceState.powder.targets[key] = Number(input.value) || 0;
    persist();
  });

  nodes.powderIngredientCards.addEventListener("input", (event) => {
    const input = event.target.closest("[data-powder-ingredient]");
    if (!input) return;
    const key = input.dataset.powderIngredient;
    priceState.powder.ingredients[key] = Number(input.value) || 0;
    persist();
  });

  nodes.powderBerryRows.addEventListener("input", (event) => {
    const input = event.target.closest("[data-powder-berry]");
    if (!input) return;
    const slug = input.dataset.powderBerry;
    priceState.berries.manual[slug] ||= { sell: 0, buy: 0 };
    priceState.berries.manual[slug].buy = Number(input.value) || 0;
    persist();
  });

  nodes.resetButton.addEventListener("click", () => {
    priceState = resetPriceState();
    nodes.berrySearch.value = "";
    render();
    nodes.saveStatus.textContent = "Defaults restored";
    window.setTimeout(() => {
      if (nodes.saveStatus.textContent === "Defaults restored") {
        nodes.saveStatus.textContent = "";
      }
    }, 1200);
  });
}
