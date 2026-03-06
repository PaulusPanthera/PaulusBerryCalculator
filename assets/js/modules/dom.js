export function select(selector, scope = document) {
  return scope.querySelector(selector);
}

export function renderHTML(target, html) {
  if (!target) {
    return;
  }

  target.innerHTML = html;
}
