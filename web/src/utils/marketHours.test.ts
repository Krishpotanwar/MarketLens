import { describe, expect, it } from "vitest";
import {
  getISTDate,
  getMarketSessionStatus,
  isExchangeClosedDay,
  validateOrderMarketHours,
} from "./marketHours";

describe("marketHours holiday calendar coverage", () => {
  it("says so when the bundled holiday table no longer covers the date", () => {
    // Tuesday 2027-01-12, 10:00 IST: a weekday the 2025-2026 table knows nothing about.
    const in2027 = getMarketSessionStatus(new Date(Date.UTC(2027, 0, 12, 4, 30, 0)));
    expect(in2027.message).toContain("holiday calendar covers only through 2026");
    const in2026 = getMarketSessionStatus(new Date(Date.UTC(2026, 9, 27, 4, 30, 0)));
    expect(in2026.message).not.toContain("holiday calendar");
  });
});

describe("marketHours utility", () => {
  it("accurately converts UTC dates to IST (UTC+05:30)", () => {
    // 2026-10-27 03:45:00 UTC = 2026-10-27 09:15:00 IST
    const utcDate = new Date(Date.UTC(2026, 9, 27, 3, 45, 0));
    const ist = getISTDate(utcDate);

    expect(ist.year).toBe(2026);
    expect(ist.month).toBe(10);
    expect(ist.day).toBe(27);
    expect(ist.hours).toBe(9);
    expect(ist.minutes).toBe(15);
    expect(ist.seconds).toBe(0);
    expect(ist.dateStr).toBe("2026-10-27");
    expect(ist.timeStr).toBe("09:15:00");
  });

  it("detects weekends (Saturday and Sunday) as closed days", () => {
    // Saturday: 2026-10-24
    const sat = getISTDate(new Date(Date.UTC(2026, 9, 24, 5, 0, 0)));
    expect(isExchangeClosedDay(sat).isClosed).toBe(true);
    expect(isExchangeClosedDay(sat).reason).toContain("Saturday");

    // Sunday: 2026-10-25
    const sun = getISTDate(new Date(Date.UTC(2026, 9, 25, 5, 0, 0)));
    expect(isExchangeClosedDay(sun).isClosed).toBe(true);
    expect(isExchangeClosedDay(sun).reason).toContain("Sunday");
  });

  it("detects official exchange holidays", () => {
    // Republic day: 2026-01-26
    const holiday = getISTDate(new Date(Date.UTC(2026, 0, 26, 5, 0, 0)));
    expect(isExchangeClosedDay(holiday).isClosed).toBe(true);
    expect(isExchangeClosedDay(holiday).reason).toContain("Holiday");
  });

  it("evaluates market as CLOSED before 09:15 AM IST on weekdays", () => {
    // 08:30:00 IST (03:00:00 UTC) on a Tuesday
    const preMarket = new Date(Date.UTC(2026, 9, 27, 3, 0, 0));
    const status = getMarketSessionStatus(preMarket);

    expect(status.state).toBe("CLOSED");
    expect(status.isOpen).toBe(false);
    expect(status.isMisAllowed).toBe(false);
    expect(status.isCncAllowed).toBe(false);

    const valMis = validateOrderMarketHours("MIS", preMarket);
    expect(valMis.allowed).toBe(false);
    expect(valMis.reason).toContain("Trading hours are 09:15 AM to 03:15 PM IST");
  });

  it("evaluates market as OPEN for both MIS and CNC between 09:15 and 15:15 IST", () => {
    // 10:30:00 IST (05:00:00 UTC) on a Tuesday
    const regularSession = new Date(Date.UTC(2026, 9, 27, 5, 0, 0));
    const status = getMarketSessionStatus(regularSession);

    expect(status.state).toBe("OPEN");
    expect(status.isOpen).toBe(true);
    expect(status.isMisAllowed).toBe(true);
    expect(status.isCncAllowed).toBe(true);

    const valMis = validateOrderMarketHours("MIS", regularSession);
    expect(valMis.allowed).toBe(true);

    const valCnc = validateOrderMarketHours("CNC", regularSession);
    expect(valCnc.allowed).toBe(true);
  });

  it("evaluates market as MIS_CLOSED between 15:15 and 15:30 IST (square-off window)", () => {
    // 15:20:00 IST (09:50:00 UTC) on a Tuesday
    const squareOffWindow = new Date(Date.UTC(2026, 9, 27, 9, 50, 0));
    const status = getMarketSessionStatus(squareOffWindow);

    expect(status.state).toBe("MIS_CLOSED");
    expect(status.isOpen).toBe(true);
    expect(status.isMisAllowed).toBe(false);
    expect(status.isCncAllowed).toBe(true);

    // MIS order is rejected
    const valMis = validateOrderMarketHours("MIS", squareOffWindow);
    expect(valMis.allowed).toBe(false);
    expect(valMis.reason).toContain("Intraday (MIS) orders are blocked after 03:15 PM IST");

    // CNC order is still permitted until 15:30
    const valCnc = validateOrderMarketHours("CNC", squareOffWindow);
    expect(valCnc.allowed).toBe(true);
  });

  it("evaluates market as CLOSED after 15:30 IST", () => {
    // 16:00:00 IST (10:30:00 UTC) on a Tuesday
    const postMarket = new Date(Date.UTC(2026, 9, 27, 10, 30, 0));
    const status = getMarketSessionStatus(postMarket);

    expect(status.state).toBe("CLOSED");
    expect(status.isOpen).toBe(false);
    expect(status.isMisAllowed).toBe(false);
    expect(status.isCncAllowed).toBe(false);

    const valCnc = validateOrderMarketHours("CNC", postMarket);
    expect(valCnc.allowed).toBe(false);
  });

  it("bypasses restrictions when bypassMarketHours is true (Simulator Mode)", () => {
    // Weekend evening
    const weekendDate = new Date(Date.UTC(2026, 9, 25, 14, 0, 0));
    const normalStatus = getMarketSessionStatus(weekendDate, false);
    expect(normalStatus.isOpen).toBe(false);

    const bypassStatus = getMarketSessionStatus(weekendDate, true);
    expect(bypassStatus.isOpen).toBe(true);
    expect(bypassStatus.isMisAllowed).toBe(true);
    expect(bypassStatus.isCncAllowed).toBe(true);

    const valMis = validateOrderMarketHours("MIS", weekendDate, true);
    expect(valMis.allowed).toBe(true);
  });
});
