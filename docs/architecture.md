# Architecture starter

## Intent

This project should stay framework-free until complexity truly justifies more tooling.

## Layers

### 1. Data

Lives in `assets/data/`.
Contains raw values only.

### 2. Logic

Lives in `assets/js/modules/`.
Contains parsing, filtering, calculations, and formatting helpers.

### 3. UI wiring

`assets/js/main.js` should stay small.
It connects page elements to logic modules.

### 4. Presentation

All visuals live in `assets/css/main.css` until the stylesheet becomes large enough to split.

## Early standards

- prefer named exports for reusable helpers
- avoid global variables
- keep DOM queries close to where they are used
- avoid mixing fetch/data logic with rendering when possible
- keep sample data and real data shaped the same way
