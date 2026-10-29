/**
 * Indian Equity Market Hours & Session Boundary Engine (NSE / BSE)
 *
 * Schedule:
 * - Regular Trading Session: Monday - Friday
 * - Market Open: 09:15:00 IST
 * - MIS Intraday Cutoff & Auto Square-off: 15:15:00 IST
 * - Market Close: 15:30:00 IST
 * - Weekends & Public Exchange Holidays: Closed
 */

import type { ProductType } from "../types/paper";

export type MarketState = "OPEN" | "MIS_CLOSED" | "CLOSED";

export interface MarketStatus {
  state: MarketState;
  isOpen: boolean;
  isMisAllowed: boolean;
  isCncAllowed: boolean;
  istTimeFormatted: string;
  istDateFormatted: string;
  message: string;
  nextEventDescription: string;
  secondsToNextEvent: number;
}

// Fixed or common NSE/BSE exchange holidays (formatted as YYYY-MM-DD in IST)
export const NSE_EXCHANGE_HOLIDAYS_2025_2026 = new Set([
  // 2025
  "2025-01-26", // Republic Day
  "2025-02-26", // Mahashivratri
  "2025-03-14", // Holi
  "2025-03-31", // Id-Ul-Fitr
  "2025-04-10", // Mahavir Jayanti
  "2025-04-14", // Dr. Baba Saheb Ambedkar Jayanti
  "2025-04-18", // Good Friday
  "2025-05-01", // Maharashtra Day
  "2025-08-15", // Independence Day
  "2025-08-27", // Ganesh Chaturthi
  "2025-10-02", // Mahatma Gandhi Jayanti
  "2025-10-21", // Diwali Laxmi Pujan
  "2025-10-22", // Diwali Balipratipada
  "2025-11-05", // Prakash Gurpurb Sri Guru Nanak Dev
  "2025-12-25", // Christmas
  // 2026
  "2026-01-26", // Republic Day
  "2026-03-03", // Holi
  "2026-03-20", // Id-ul-Fitr
  "2026-04-03", // Good Friday
  "2026-04-14", // Dr Ambedkar Jayanti
  "2026-05-01", // Maharashtra Day
  "2026-08-15", // Independence Day
  "2026-10-02", // Mahatma Gandhi Jayanti
  "2026-10-20", // Dussehra
  "2026-11-09", // Diwali
  "2026-12-25", // Christmas
]);

/**
 * Returns current date/time converted explicitly to Indian Standard Time (UTC+05:30)
 */
export function getISTDate(referenceDate: Date = new Date()): {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  hours: number;
  minutes: number;
  seconds: number;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:MM:SS
} {
  // Use Intl.DateTimeFormat with Asia/Kolkata timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(referenceDate);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10);
  const day = parseInt(partMap.day, 10);
  const hours = parseInt(partMap.hour === "24" ? "00" : partMap.hour, 10);
  const minutes = parseInt(partMap.minute, 10);
  const seconds = parseInt(partMap.second, 10);

  // Day of week in IST
  // We can calculate it reliably from year, month, day
  const istDateObj = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = istDateObj.getUTCDay();

  const pad = (n: number) => n.toString().padStart(2, "0");
  const dateStr = `${year}-${pad(month)}-${pad(day)}`;
  const timeStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return {
    year,
    month,
    day,
    dayOfWeek,
    hours,
    minutes,
    seconds,
    dateStr,
    timeStr,
  };
}

/**
 * Checks whether the given IST date is an exchange holiday or weekend
 */
export function isExchangeClosedDay(ist: ReturnType<typeof getISTDate>): {
  isClosed: boolean;
  reason?: string;
} {
  if (ist.dayOfWeek === 0) {
    return { isClosed: true, reason: "Sunday (Weekend Closure)" };
  }
  if (ist.dayOfWeek === 6) {
    return { isClosed: true, reason: "Saturday (Weekend Closure)" };
  }
  if (NSE_EXCHANGE_HOLIDAYS_2025_2026.has(ist.dateStr)) {
    return { isClosed: true, reason: "NSE/BSE Exchange Holiday" };
  }
  return { isClosed: false };
}

/** Last day the bundled holiday table above covers. Later weekdays are assumed open, and say so. */
const HOLIDAY_CALENDAR_THROUGH = "2026-12-31";

/**
 * Evaluates current Indian market session status
 */
export function getMarketSessionStatus(
  referenceDate: Date = new Date(),
  bypassMarketHours: boolean = false
): MarketStatus {
  const status = sessionStatus(referenceDate, bypassMarketHours);
  if (!bypassMarketHours && getISTDate(referenceDate).dateStr > HOLIDAY_CALENDAR_THROUGH) {
    return { ...status, message: `${status.message} (holiday calendar covers only through 2026; check NSE)` };
  }
  return status;
}

function sessionStatus(referenceDate: Date, bypassMarketHours: boolean): MarketStatus {
  const ist = getISTDate(referenceDate);
  const { isClosed: isHolidayOrWeekend, reason: holidayReason } = isExchangeClosedDay(ist);

  const currentMinutesFromMidnight = ist.hours * 60 + ist.minutes;
  const openMinutes = 9 * 60 + 15; // 09:15 IST = 555 min
  const misCutoffMinutes = 15 * 60 + 15; // 15:15 IST = 915 min
  const closeMinutes = 15 * 60 + 30; // 15:30 IST = 930 min

  if (bypassMarketHours) {
    return {
      state: "OPEN",
      isOpen: true,
      isMisAllowed: true,
      isCncAllowed: true,
      istTimeFormatted: `${ist.timeStr} IST`,
      istDateFormatted: ist.dateStr,
      message: "Market Hours Bypassed (24/7 Simulator Active)",
      nextEventDescription: "Bypass mode active",
      secondsToNextEvent: 0,
    };
  }

  if (isHolidayOrWeekend) {
    // Calculate seconds until next Monday 09:15 IST
    let daysToAdd = (8 - ist.dayOfWeek) % 7;
    if (daysToAdd === 0) daysToAdd = 1;
    return {
      state: "CLOSED",
      isOpen: false,
      isMisAllowed: false,
      isCncAllowed: false,
      istTimeFormatted: `${ist.timeStr} IST`,
      istDateFormatted: ist.dateStr,
      message: `Market Closed: ${holidayReason}`,
      nextEventDescription: "Opens Monday at 09:15 AM IST",
      secondsToNextEvent: daysToAdd * 86400,
    };
  }

  // Weekday logic
  if (currentMinutesFromMidnight < openMinutes) {
    const diffSec = (openMinutes - currentMinutesFromMidnight) * 60 - ist.seconds;
    return {
      state: "CLOSED",
      isOpen: false,
      isMisAllowed: false,
      isCncAllowed: false,
      istTimeFormatted: `${ist.timeStr} IST`,
      istDateFormatted: ist.dateStr,
      message: "Pre-Market / Closed (Trading opens at 09:15 AM IST)",
      nextEventDescription: `Opens in ${formatDuration(diffSec)}`,
      secondsToNextEvent: diffSec,
    };
  }

  if (currentMinutesFromMidnight >= openMinutes && currentMinutesFromMidnight < misCutoffMinutes) {
    const diffSec = (misCutoffMinutes - currentMinutesFromMidnight) * 60 - ist.seconds;
    return {
      state: "OPEN",
      isOpen: true,
      isMisAllowed: true,
      isCncAllowed: true,
      istTimeFormatted: `${ist.timeStr} IST`,
      istDateFormatted: ist.dateStr,
      message: "NSE/BSE Regular Trading Live (09:15 - 15:15 IST)",
      nextEventDescription: `MIS Auto Square-Off in ${formatDuration(diffSec)}`,
      secondsToNextEvent: diffSec,
    };
  }

  if (currentMinutesFromMidnight >= misCutoffMinutes && currentMinutesFromMidnight < closeMinutes) {
    const diffSec = (closeMinutes - currentMinutesFromMidnight) * 60 - ist.seconds;
    return {
      state: "MIS_CLOSED",
      isOpen: true,
      isMisAllowed: false,
      isCncAllowed: true,
      istTimeFormatted: `${ist.timeStr} IST`,
      istDateFormatted: ist.dateStr,
      message: "MIS Closed: Auto Square-Off Active (Delivery CNC Only until 15:30 IST)",
      nextEventDescription: `Market Closes in ${formatDuration(diffSec)}`,
      secondsToNextEvent: diffSec,
    };
  }

  // >= 15:30 IST
  return {
    state: "CLOSED",
    isOpen: false,
    isMisAllowed: false,
    isCncAllowed: false,
    istTimeFormatted: `${ist.timeStr} IST`,
    istDateFormatted: ist.dateStr,
    message: "Market Closed (Trading concluded for today)",
    nextEventDescription: ist.dayOfWeek === 5 ? "Opens Monday at 09:15 AM IST" : "Opens tomorrow at 09:15 AM IST",
    secondsToNextEvent: 0,
  };
}

/**
 * Validates whether a specific order product (CNC or MIS) can be submitted
 */
export function validateOrderMarketHours(
  product: ProductType,
  referenceDate: Date = new Date(),
  bypassMarketHours: boolean = false
): {
  allowed: boolean;
  reason?: string;
} {
  const status = getMarketSessionStatus(referenceDate, bypassMarketHours);

  if (bypassMarketHours) {
    return { allowed: true };
  }

  if (status.state === "CLOSED") {
    return {
      allowed: false,
      reason: `Order rejected: Indian stock exchanges (NSE/BSE) are closed. Trading hours are 09:15 AM to 03:15 PM IST (Mon-Fri). ${status.nextEventDescription}.`,
    };
  }

  if (status.state === "MIS_CLOSED" && product === "MIS") {
    return {
      allowed: false,
      reason: `Order rejected: Intraday (MIS) orders are blocked after 03:15 PM IST per Indian exchange auto square-off rules. Only Delivery (CNC) is allowed until 03:30 PM.`,
    };
  }

  return { allowed: true };
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0s";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
