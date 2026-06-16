# Architecture

PaulusBerryCalculator is a static GitHub Pages style site. It uses plain HTML, one shared CSS file, and small purpose-specific JavaScript modules.

## Page entry points

- `index.html` -> Home dashboard
- `pages/berrydex.html` -> BerryDex catalog
- `pages/seeds.html` -> seed route comparison
- `pages/berries.html` -> berry route comparison
- `pages/leppa.html` -> Leppa baselines
- `pages/powder.html` -> Berry Powder routes
- `pages/shopping.html` -> Shopping List / seed basket
- `pages/shop.html` -> shared Prices page
- `pages/guide.html` -> guide and notes
- `pages/about.html` -> project information

All pages load `assets/js/main.js`, which detects `body` classes and initializes the matching page modules.

## Important modules

- `assets/js/modules/catalog/data.js` is the active berry catalog source.
- `assets/js/modules/pricing/store.js` owns shared price state and local storage.
- `assets/js/modules/pricing/auto.js` handles GTL auto snapshots.
- `assets/js/modules/seed-harvest/logic.js` owns harvested-seed output math.
- `assets/js/modules/recipes/variants.js` owns exact and `Very + 2 plain` recipe variants.
- `assets/js/modules/shopping/logic.js` owns the Shopping List state and seed basket math.

## Data rules

- Harvest Tool is fixed at 350.
- Seed buy and seed sell prices are separate.
- Powder target and extra ingredient prices come from Prices.
- Recipe variants should be added through `recipes/variants.js`, not duplicated per page.

## Keep it simple

The project should remain framework-free. Prefer small shared helpers over large rewrites.
