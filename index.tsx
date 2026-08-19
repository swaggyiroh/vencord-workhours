/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors*
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { getUserSettingLazy } from "@api/UserSettings";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";

import { isWorkTime, parseDays, parseTime } from "./schedule";

const logger = new Logger("WorkingHours");

const StatusSettings = getUserSettingLazy<string>("status", "status")!;

const CHECK_INTERVAL = 30_000;
/** Settings changes fire per keystroke, so wait for typing to settle before acting on them */
const SETTINGS_DEBOUNCE = 2_000;

const settings = definePluginSettings(
  {
    startTime: {
      type: OptionType.STRING,
      description: "When your working hours start (24h HH:MM, local time)",
      default: "08:00",
      placeholder: "08:00",
      onChange: () => scheduleRecheck(),
    },
    endTime: {
      type: OptionType.STRING,
      description: "When your working hours end (24h HH:MM, local time). ",
      default: "17:00",
      placeholder: "17:00",
      onChange: () => scheduleRecheck(),
    },
    workDays: {
      type: OptionType.STRING,
      description:
        'Days you work. Comma separated, ranges allowed, e.g. "Mon-Fri" or "Mon,Tue,Sat"',
      default: "Mon-Fri",
      placeholder: "Mon-Fri",
      onChange: () => scheduleRecheck(),
    },
    workStatus: {
      type: OptionType.SELECT,
      description: "Status to set when your working hours start",
      options: [
        { label: "Online", value: "online" },
        { label: "Idle", value: "idle" },
        { label: "Do Not Disturb", value: "dnd", default: true },
        { label: "Invisible", value: "invisible" },
      ],
    },
    offStatus: {
      type: OptionType.SELECT,
      description: "Status to set when your working hours end",
      options: [
        { label: "Online", value: "online", default: true },
        { label: "Idle", value: "idle" },
        { label: "Do Not Disturb", value: "dnd" },
        { label: "Invisible", value: "invisible" },
        { label: "Don't change it", value: "none" },
      ],
    },
    applyOnStartup: {
      type: OptionType.BOOLEAN,
      description:
        "Also apply your working hours status right after Discord starts (only while you are within working hours)",
      default: true,
    },
  },
  {
    startTime: {
      isValid: (value) =>
        parseTime(value) !== null ||
        "Must be a time in HH:MM format, e.g. 09:00",
    },
    endTime: {
      isValid: (value) =>
        parseTime(value) !== null ||
        "Must be a time in HH:MM format, e.g. 17:00",
    },
    workDays: {
      isValid: (value) =>
        parseDays(value) !== null ||
        "Must be a list of days, e.g. Mon-Fri or Mon,Tue,Sat",
    },
  },
);

type Phase = "work" | "off";

let lastPhase: Phase | null = null;
let intervalId: ReturnType<typeof setInterval> | undefined;
let recheckId: ReturnType<typeof setTimeout> | undefined;

async function setStatus(status: string) {
  if (status === "none" || StatusSettings.getSetting() === status) return;

  try {
    await StatusSettings.updateSetting(status);
  } catch (err) {
    logger.error(`Failed to set status to ${status}`, err);
  }
}

/**
 * Only acts on transitions between phases, so a status you pick manually mid-phase
 * survives until the next start/end of your working hours.
 */
async function check() {
  const phase: Phase = isWorkTime(new Date(), settings.store) ? "work" : "off";
  if (phase === lastPhase) return;

  const isFirstCheck = lastPhase === null;
  lastPhase = phase;

  if (isFirstCheck) {
    if (phase === "work" && settings.store.applyOnStartup)
      await setStatus(settings.store.workStatus);
    return;
  }

  await setStatus(
    phase === "work" ? settings.store.workStatus : settings.store.offStatus,
  );
}

function scheduleRecheck() {
  clearTimeout(recheckId);
  recheckId = setTimeout(check, SETTINGS_DEBOUNCE);
}

export default definePlugin({
  name: "WorkingHours",
  description:
    "Automatically sets your status to Do Not Disturb during your working hours, and back afterwards",
  tags: ["Activity", "Utility"],
  authors: [{ name: "Iroh", id: 0n }],
  settings,

  start() {
    lastPhase = null;
    check();
    intervalId = setInterval(check, CHECK_INTERVAL);
  },

  stop() {
    clearInterval(intervalId);
    clearTimeout(recheckId);
    intervalId = recheckId = undefined;
    lastPhase = null;
  },
});
