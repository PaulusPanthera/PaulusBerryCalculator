import { select, renderHTML } from "./dom.js";
import { formatMoney, escapeHTML } from "./format.js";

const DATA_PATH = "./assets/data/berries.sample.json";

function createBerryCard(berry) {
  return `
    <article class="berry-card">
      <p class="eyebrow">${escapeHTML(berry.tier)}</p>
      <h3>${escapeHTML(berry.name)}</h3>
      <p class="muted">${escapeHTML(berry.notes)}</p>
      <div class="berry-card__meta">
        <span class="pill">Buy: ${formatMoney(berry.buyPrice)}</span>
        <span class="pill">Sell: ${formatMoney(berry.sellPrice)}</span>
      </div>
    </article>
  `;
}

function renderSummary(target, berries) {
  const profitableCount = berries.filter((berry) => berry.sellPrice > berry.buyPrice).length;

  renderHTML(
    target,
    `
      <span>Total: ${berries.length}</span>
      <span>Profitable examples: ${profitableCount}</span>
    `,
  );
}

function renderBerries(target, berries) {
  if (!berries.length) {
    renderHTML(
      target,
      '<p class="muted">No berries match the current search. Replace this with your own empty state later.</p>',
    );
    return;
  }

  renderHTML(target, berries.map(createBerryCard).join(""));
}

async function loadBerries() {
  const response = await fetch(DATA_PATH);

  if (!response.ok) {
    throw new Error(`Could not load berry data from ${DATA_PATH}`);
  }

  return response.json();
}

export async function initBerryApp() {
  const resultsNode = select("#berry-results");
  const searchNode = select("#berry-search");
  const summaryNode = select("#berry-summary");

  if (!resultsNode || !searchNode || !summaryNode) {
    return;
  }

  try {
    const berries = await loadBerries();

    renderSummary(summaryNode, berries);
    renderBerries(resultsNode, berries);

    searchNode.addEventListener("input", (event) => {
      const query = event.currentTarget.value.trim().toLowerCase();
      const filtered = berries.filter((berry) => berry.name.toLowerCase().includes(query));

      renderBerries(resultsNode, filtered);
    });
  } catch (error) {
    console.error(error);
    renderHTML(
      resultsNode,
      '<p class="muted">Sample data failed to load. Start a local server before previewing JSON-driven pages.</p>',
    );
  }
}
