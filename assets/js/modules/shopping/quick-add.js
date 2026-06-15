// assets/js/modules/shopping/quick-add.js
// v2.0.0-beta
// Global quick-add wiring that lets berry cards add one full character of seeds to the Shopping List.
import {
  addShoppingEntry,
  getCheapestShoppingMethodKey,
  getShoppingMethodOptions,
  getShoppingState,
  saveShoppingState,
} from "./logic.js";

const QUICK_ADD_CHARACTERS = 1;
const QUICK_ADD_PLANTINGS = 1;
const TOAST_TIMEOUT_MS = 1600;

let toastTimer = null;

function resolveMethodKey(berrySlug, requestedMethodKey) {
  const methods = getShoppingMethodOptions(berrySlug);
  const fallback = methods[0]?.key || "exact";

  if (
    !requestedMethodKey ||
    requestedMethodKey === "best" ||
    requestedMethodKey === "buy" ||
    requestedMethodKey === "self"
  ) {
    return getCheapestShoppingMethodKey(berrySlug);
  }

  if (methods.some((method) => method.key === requestedMethodKey)) {
    return requestedMethodKey;
  }

  const compatibleSwap = methods.find((method) => method.key.startsWith(`${requestedMethodKey}-`));

  return compatibleSwap?.key || fallback;
}

function getToastNode() {
  let node = document.querySelector("#shopping-quick-add-toast");

  if (node) {
    return node;
  }

  node = document.createElement("div");
  node.id = "shopping-quick-add-toast";
  node.className = "shopping-quick-add-toast";
  node.setAttribute("role", "status");
  node.setAttribute("aria-live", "polite");
  document.body.append(node);
  return node;
}

function showToast(message) {
  const node = getToastNode();

  node.textContent = message;
  node.classList.add("is-visible");

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    node.classList.remove("is-visible");
  }, TOAST_TIMEOUT_MS);
}

function addQuickShoppingEntry(button) {
  const berrySlug = button.dataset.shoppingAddBerry;

  if (!berrySlug) {
    return;
  }

  const methodKey = resolveMethodKey(berrySlug, button.dataset.shoppingMethodKey);
  const berryLabel = button.dataset.shoppingLabel || "berry";
  const nextState = addShoppingEntry(getShoppingState(), {
    berrySlug,
    methodKey,
    characters: QUICK_ADD_CHARACTERS,
    plantings: QUICK_ADD_PLANTINGS,
  });

  saveShoppingState(nextState);
  showToast(`Added 1-char ${berryLabel} seeds to Shopping List`);
  window.dispatchEvent(
    new CustomEvent("shopping:quick-add", {
      detail: { berrySlug, methodKey },
    }),
  );
}

export function initShoppingQuickAdd() {
  document.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest("[data-shopping-add-berry]");

      if (!button) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      addQuickShoppingEntry(button);
    },
    true,
  );
}
