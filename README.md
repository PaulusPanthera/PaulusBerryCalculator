# PaulusBerryCalculator

Static starter for your berry calculator website.

## Status

This project is proprietary.
All rights reserved.
No permission is granted to use, copy, modify, distribute, host, or create derivative works from this repository without prior written permission.

## What this template is for

A very small static site that still follows good habits:

- clean folder structure
- modular JavaScript
- separate data, style, and UI concerns
- local development in the same folder you will later push
- lightweight checks with Prettier and ESLint
- simple PowerShell scripts for setup, local preview, pushes, and releases

## Folder structure

```text
PaulusBerryCalculator/
├─ .github/
│  └─ workflows/
├─ .vscode/
├─ assets/
│  ├─ css/
│  ├─ data/
│  ├─ icons/
│  ├─ img/
│  └─ js/
│     └─ modules/
├─ docs/
├─ pages/
├─ scripts/
├─ 404.html
├─ index.html
├─ package.json
└─ README.md
```

## Local workflow

After unzipping, this folder is your actual local project folder.
You edit files here, run Git here, and push from here.

### First-time setup

```powershell
cd .\PaulusBerryCalculator_proprietary_template
npm install
.\scripts\init-repo.ps1
git add .
git commit -m "chore: initial project setup"
git push -u origin main
```

### Daily workflow

```powershell
.\scripts\serve.ps1
npm run check
git status
git add .
git commit -m "feat: your change"
git push origin main
```

Or use the helper:

```powershell
.\scripts\push-main.ps1 -Message "feat: your change"
```

## Recommended coding rhythm

1. Start with raw data shape first.
2. Add the smallest useful UI.
3. Add only the JS needed for that feature.
4. Keep functions short and focused.
5. Run checks before every push.
6. Prefer small commits over giant rewrites.
7. Tag stable milestones.

## Publishing idea

Keep the repository as your source of truth.
Use `main` for stable work.
Use tags for versions.
Use GitHub Releases when you want downloadable snapshots.

## Notes for a berry calculator

Try to separate these concerns early:

- raw berry values in `assets/data/`
- formulas and calculations in `assets/js/modules/`
- page wiring in `assets/js/main.js`
- presentation in `assets/css/main.css`

That makes later growth much easier without needing a framework too early.
