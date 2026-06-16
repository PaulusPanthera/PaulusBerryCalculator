# PaulusBerryCalculator

A static, framework-free PokeMMO berry farming calculator focused on practical money-per-day decisions, shared price settings, and clear route comparison.

## What it does

- **Home**: dashboard for top seed routes, berry routes, Leppa routes, powder routes, and breakpoint highlights.
- **BerryDex**: berry catalog with recipes, yields, vendor values, and harvest-tool seed output/breakpoint details.
- **Seeds**: seed-production route comparison with sell-value and self-use valuation modes.
- **Berry Routes**: berry-selling route comparison with buy-seed and simple self-sufficient route families.
- **Leppa**: clean normalized Leppa baselines for seed-buy and self-sufficient support approaches.
- **Berry Powder**: powder crafting route comparison using shared Shop prices.
- **Shopping List**: seed basket planner with inventory deduction and quick-add buttons from other pages.
- **Prices**: shared pricing control center stored in local storage, including optional Leppa and EV/NPC berry seed packet overrides.
- **Guide**: project notes, berry basics, and practical farming explanations.

## Project rules

- Static website only: plain HTML, CSS, and modular JavaScript.
- No backend and no framework.
- Shared prices live in local storage under:

```txt
paulus-berry-calculator-price-state-v1
```

- Harvest Tool is fixed at **350** and is not configurable.
- Optional seed packet overrides can replace individual seed prices for direct Leppa and EV/NPC berry buy-seed routes.
- Harvested-seed output follows the current observed model:
  - 1 berry becomes 1 seed.
  - color chance is weighted by recipe flavor points.
  - 1 flavor point outputs plain only.
  - 2+ flavor points output 70% plain / 30% very.
- Current version label stays fixed at `v2.0.0-beta`.

## Local workflow

```powershell
npm install
npm run check
python -m http.server 8000
```

Open:

```txt
http://localhost:8000
```

## Deploy

This project is GitHub Pages friendly. Push to `main`; Pages can publish from the repository root.

```powershell
git add .
git commit -m "Describe the change"
git push
```

## Notes

This is an unofficial fan tool. Pokémon is © Nintendo / Creatures Inc. / GAME FREAK inc.
