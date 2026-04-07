// assets/js/modules/dom.js
// v2.0.0-beta
// Small DOM helpers for selection and safe innerHTML replacement.
export function select(selector, scope = document) {
  return scope.querySelector(selector);
}

export function selectAll(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

export function renderHTML(target, html) {
  if (!target) {
    return;
  }

  target.innerHTML = html;
}
