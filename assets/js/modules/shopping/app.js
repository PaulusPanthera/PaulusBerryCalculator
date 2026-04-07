// assets/js/modules/shopping/app.js
// v2.0.0-beta
// Shopping List page wiring for adding berry plans, persisting the cart, and aggregating seed buy needs.
import { select } from "../dom.js";
import { getPriceState } from "../pricing/store.js";
import {
  addShoppingEntry,
  clearShoppingEntries,
  getShoppingBerryOptions,
  getShoppingMethodOptions,
  getShoppingPlan,
  getShoppingState,
  resetShoppingInventory,
  resetShoppingState,
  removeShoppingEntry,
  saveShoppingState,
  updateShoppingDraft,
  updateShoppingInventory,
} from "./logic.js";
import {
  renderBerryOptions,
  renderCartEntries,
  renderCartSummary,
  renderMethodOptions,
  renderSeedBasket,
  renderSeedNeedSummary,
  renderShoppingHeroSummary,
} from "./render.js";

export function initShoppingApp() {
  const nodes = {
    heroSummary: select("#shopping-hero-summary"),
    berrySelect: select("#shopping-berry"),
    methodSelect: select("#shopping-method"),
    charactersInput: select("#shopping-characters"),
    plantingsInput: select("#shopping-plantings"),
    addButton: select("#shopping-add"),
    resetButton: select("#shopping-reset"),
    clearEntriesButton: select("#shopping-clear-entries"),
    resetBagButton: select("#shopping-reset-bag"),
    saveStatus: select("#shopping-save-status"),
    cartSummary: select("#shopping-cart-summary"),
    cartResults: select("#shopping-cart-results"),
    seedSummary: select("#shopping-seed-summary"),
    seedBasket: select("#shopping-seed-basket"),
  };

  if (Object.values(nodes).some((node) => node === null)) {
    return;
  }

  const berryOptions = getShoppingBerryOptions();
  let shoppingState = getShoppingState();

  function persist(message = "Saved") {
    saveShoppingState(shoppingState);
    nodes.saveStatus.textContent = message;
    window.setTimeout(() => {
      if (nodes.saveStatus.textContent === message) {
        nodes.saveStatus.textContent = "";
      }
    }, 1100);
  }

  function syncDraftControls() {
    renderBerryOptions(nodes.berrySelect, berryOptions, shoppingState.draftBerrySlug);
    renderMethodOptions(
      nodes.methodSelect,
      getShoppingMethodOptions(shoppingState.draftBerrySlug),
      shoppingState.draftMethodKey,
    );
    nodes.charactersInput.value = String(shoppingState.draftCharacters);
    nodes.plantingsInput.value = String(shoppingState.draftPlantings);
  }

  function render() {
    const priceState = getPriceState();
    const plan = getShoppingPlan(shoppingState, priceState);

    syncDraftControls();
    renderShoppingHeroSummary(nodes.heroSummary, plan);
    renderCartSummary(nodes.cartSummary, plan);
    renderCartEntries(nodes.cartResults, plan);
    renderSeedNeedSummary(nodes.seedSummary, plan);
    renderSeedBasket(nodes.seedBasket, plan);
  }

  render();

  nodes.berrySelect.addEventListener("change", () => {
    shoppingState = updateShoppingDraft(shoppingState, {
      draftBerrySlug: nodes.berrySelect.value,
    });
    persist("Draft saved");
    render();
  });

  nodes.methodSelect.addEventListener("change", () => {
    shoppingState = updateShoppingDraft(shoppingState, {
      draftMethodKey: nodes.methodSelect.value,
    });
    persist("Draft saved");
    render();
  });

  nodes.charactersInput.addEventListener("input", () => {
    shoppingState = updateShoppingDraft(shoppingState, {
      draftCharacters: nodes.charactersInput.value,
    });
    persist("Draft saved");
    render();
  });

  nodes.plantingsInput.addEventListener("input", () => {
    shoppingState = updateShoppingDraft(shoppingState, {
      draftPlantings: nodes.plantingsInput.value,
    });
    persist("Draft saved");
    render();
  });

  nodes.addButton.addEventListener("click", () => {
    shoppingState = addShoppingEntry(shoppingState, {
      berrySlug: shoppingState.draftBerrySlug,
      methodKey: shoppingState.draftMethodKey,
      characters: shoppingState.draftCharacters,
      plantings: shoppingState.draftPlantings,
    });
    persist("Entry added");
    render();
  });

  nodes.clearEntriesButton.addEventListener("click", () => {
    shoppingState = clearShoppingEntries(shoppingState);
    persist("Cart cleared");
    render();
  });

  nodes.resetBagButton.addEventListener("click", () => {
    shoppingState = resetShoppingInventory(shoppingState);
    persist("Bag reset");
    render();
  });

  nodes.resetButton.addEventListener("click", () => {
    shoppingState = resetShoppingState();
    nodes.saveStatus.textContent = "Defaults restored";
    window.setTimeout(() => {
      if (nodes.saveStatus.textContent === "Defaults restored") {
        nodes.saveStatus.textContent = "";
      }
    }, 1200);
    render();
  });

  nodes.cartResults.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-entry]");

    if (!button) {
      return;
    }

    shoppingState = removeShoppingEntry(shoppingState, button.dataset.removeEntry);
    persist("Entry removed");
    render();
  });

  nodes.seedBasket.addEventListener("input", (event) => {
    const input = event.target.closest("[data-shopping-flavor][data-shopping-type]");

    if (!input) {
      return;
    }

    shoppingState = updateShoppingInventory(
      shoppingState,
      input.dataset.shoppingFlavor,
      input.dataset.shoppingType,
      input.value,
    );
    persist();
    render();
  });
}
