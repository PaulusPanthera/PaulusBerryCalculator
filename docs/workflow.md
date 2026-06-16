# Workflow

## Local check

```powershell
npm install
npm run check
```

## Local smoke test

```powershell
python -m http.server 8000
```

Open `http://localhost:8000` and manually check:

- Home loads.
- BerryDex opens berry details.
- Seeds switches flavor tabs and valuation modes.
- Berry Routes, Leppa, Berry Powder, Shopping List, Prices, and Guide load.
- `+ 1 char seeds` adds the correct berry to Shopping List.
- Price edits persist after refresh.

## Commit and push

```powershell
git status
git add .
git commit -m "Describe the change"
git push
```

GitHub Pages redeploys from `main`.

## Patch discipline

- Fix real bugs first.
- Prefer surgical edits.
- Do not refactor architecture just for style.
- Keep recipe variants and harvested-seed math centralized.
- Run `npm run check` before pushing.
