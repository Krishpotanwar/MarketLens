import { describe, expect, it } from "vitest";
import { advanceDot, type Dot } from "./dots";

describe("DotBackground animation physics", () => {
  it("leaves dots static when pointer is null", () => {
    const dot: Dot = { x: 50, y: 50, offsetX: 0, offsetY: 0 };
    const moving = advanceDot(dot, null, 0.1);
    expect(moving).toBe(false);
    expect(dot.offsetX).toBe(0);
    expect(dot.offsetY).toBe(0);
  });

  it("repels dots when pointer is near", () => {
    const dot: Dot = { x: 50, y: 50, offsetX: 0, offsetY: 0 };
    // Pointer at (55, 50), distance is 5px
    const moving = advanceDot(dot, { x: 55, y: 50 }, 0.5);
    expect(moving).toBe(true);
    // dx = dot.x - pointer.x = 50 - 55 = -5 (pushed to the left)
    expect(dot.offsetX).toBeLessThan(0);
  });

  it("settles dot when outside repulsion radius", () => {
    const dot: Dot = { x: 50, y: 50, offsetX: 5, offsetY: 0 };
    // Pointer at (500, 500), distance >> 110px
    const moving = advanceDot(dot, { x: 500, y: 500 }, 0.5);
    expect(moving).toBe(true);
    // Moves towards 0
    expect(dot.offsetX).toBeLessThan(5);
  });
});
