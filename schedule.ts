/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors*
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const TIME_REGEX = /^(\d{1,2}):(\d{2})$/;

export interface Schedule {
    startTime: string;
    endTime: string;
    workDays: string;
}

/** Parses "HH:MM" into minutes since midnight, or null if malformed */
export function parseTime(value: string): number | null {
    const match = TIME_REGEX.exec(value.trim());
    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;

    return hours * 60 + minutes;
}

/** Parses a day list like "Mon-Fri, Sun" into a set of JS weekday numbers, or null if malformed */
export function parseDays(value: string): Set<number> | null {
    const days = new Set<number>();

    for (const part of value.split(",")) {
        const token = part.trim().toLowerCase();
        if (!token) continue;

        const bounds = token.split("-").map(bound => DAY_NAMES.indexOf(bound.trim().slice(0, 3)));
        if (bounds.some(day => day === -1)) return null;

        if (bounds.length === 1) {
            days.add(bounds[0]);
        } else if (bounds.length === 2) {
            const [from, to] = bounds;
            // walk forwards so wrapping ranges like Fri-Mon work
            for (let i = 0; i < 7; i++) {
                const day = (from + i) % 7;
                days.add(day);
                if (day === to) break;
            }
        } else {
            return null;
        }
    }

    return days.size ? days : null;
}

/**
 * Whether `now` falls inside the configured working hours.
 * Returns false for an unusable schedule, so a typo never changes your status.
 */
export function isWorkTime(now: Date, schedule: Schedule): boolean {
    const days = parseDays(schedule.workDays);
    const start = parseTime(schedule.startTime);
    const end = parseTime(schedule.endTime);

    if (!days || start === null || end === null || start === end) return false;

    const minutes = now.getHours() * 60 + now.getMinutes();
    const today = now.getDay();

    if (start < end) return days.has(today) && minutes >= start && minutes < end;

    // overnight shift: the window belongs to the day it started on
    if (minutes >= start) return days.has(today);
    if (minutes < end) return days.has((today + 6) % 7);
    return false;
}
