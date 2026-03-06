import { initBerryApp } from "./modules/app.js";

const yearNode = document.querySelector("#current-year");

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

initBerryApp();
