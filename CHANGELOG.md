# Changelog

## v2.0.0-beta

### Current project state

- Added Home dashboard, Guide page, BerryDex, Seeds, Berry Routes, Leppa, Berry Powder, Shopping List, and Prices pages.
- Added shared local-storage price state.
- Added GTL auto-pricing support with fee handling.
- Added Shopping List with one-character quick-add buttons from berry cards.
- Added recipe variants for `Very + 2 plain` planting methods where valid.
- Updated seed-harvest math to the observed flavor-point model:
  - 1 berry -> 1 seed
  - flavor-point weighted color shares
  - 1 point -> plain only
  - 2+ points -> 70% plain / 30% very
- Added sell-value vs self-use valuation on the Seeds page.
- Reworked Leppa into clean normalized baselines for seed-buy and self-sufficient approaches.
- Added optional seed packet overrides for direct Leppa and EV/NPC berry buy-seed routes.
- Removed stale starter data files.
