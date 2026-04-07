// assets/js/main.js
// v2.0.0-beta
// Entry point for page-specific app wiring, including Home, BerryDex, route tabs, and footer year.
import { initBerryApp } from "./modules/app.js";
import { initSeedApp } from "./modules/seeds/app.js";
import { initShopApp } from "./modules/shop/app.js";
import { initBerryRoutesApp } from "./modules/berries/app.js";
import { initPowderApp } from "./modules/powder/app.js";
import { initLeppaApp } from "./modules/leppa/app.js";
import { initShoppingApp } from "./modules/shopping/app.js";
import { initHomeApp } from "./modules/home/app.js";

const yearNode = document.querySelector("#current-year");

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

if (document.body.classList.contains("home-page")) {
  initHomeApp();
}

if (
  document.body.classList.contains("berrydex-page") ||
  document.body.classList.contains("catalog-page")
) {
  initBerryApp();
}

if (document.body.classList.contains("seeds-page")) {
  initSeedApp();
}

if (document.body.classList.contains("shop-page")) {
  initShopApp();
}

if (document.body.classList.contains("berries-page")) {
  initBerryRoutesApp();
}

if (document.body.classList.contains("powder-page")) {
  initPowderApp();
}

if (document.body.classList.contains("leppa-page")) {
  initLeppaApp();
}

if (document.body.classList.contains("shopping-page")) {
  initShoppingApp();
}
