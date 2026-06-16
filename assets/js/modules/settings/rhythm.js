// assets/js/modules/settings/rhythm.js
// v2.0.0-beta
// Shared farming-rhythm helpers for normal schedule math and exact flow uptime math.

export const RHYTHM_MODES = {
  normal: {
    label: "Normal",
    summary: "Standard day schedule",
  },
  flow: {
    label: "Flow",
    summary: "Exact grow-time uptime",
  },
};

export function normalizeRhythmMode(value) {
  return value === "flow" ? "flow" : "normal";
}

export function getStandardDaysForGrowth(growthHours) {
  if (growthHours <= 20) {
    return 1;
  }

  if (growthHours <= 44) {
    return 2;
  }

  return 3;
}

export function getScheduleDaysForGrowth(growthHours, rhythmMode = "normal") {
  const hours = Number(growthHours) || 24;

  if (normalizeRhythmMode(rhythmMode) === "flow") {
    return hours / 24;
  }

  return getStandardDaysForGrowth(hours);
}

export function getHarvestsPerDay(growthHours, rhythmMode = "normal") {
  const scheduleDays = getScheduleDaysForGrowth(growthHours, rhythmMode);

  return scheduleDays > 0 ? 1 / scheduleDays : 0;
}

export function getRhythmLabel(rhythmMode = "normal") {
  return RHYTHM_MODES[normalizeRhythmMode(rhythmMode)].label;
}

export function getRhythmSummary(rhythmMode = "normal") {
  return RHYTHM_MODES[normalizeRhythmMode(rhythmMode)].summary;
}
