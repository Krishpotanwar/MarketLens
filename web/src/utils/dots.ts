export interface Dot {
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Calculates smooth elastic repulsion when the user hovers/moves pointer near dots.
 * Ported from flood-route and calibrated for high-performance canvas rendering.
 */
export function advanceDot(
  dot: Dot,
  pointer: { x: number; y: number } | null,
  blend: number
): boolean {
  let targetX = 0;
  let targetY = 0;
  if (pointer) {
    const dx = dot.x - pointer.x;
    const dy = dot.y - pointer.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 0 && distance < 110) {
      const force = (16 * (1 - distance / 110) ** 2) / distance;
      targetX = dx * force;
      targetY = dy * force;
    }
  }
  dot.offsetX += (targetX - dot.offsetX) * blend;
  dot.offsetY += (targetY - dot.offsetY) * blend;
  const moving =
    Math.abs(targetX - dot.offsetX) > 0.04 || Math.abs(targetY - dot.offsetY) > 0.04;
  if (!moving) {
    dot.offsetX = targetX;
    dot.offsetY = targetY;
  }
  return moving;
}
