import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { TimelineScenario } from "../types/aiSimulation";
import { TimelineBranchingTree } from "./TimelineBranchingTree";

const scenario = (id: TimelineScenario["id"], probabilityPercent: number): TimelineScenario => ({
  id,
  name: id,
  probabilityPercent,
  expectedReturnRange: "+1% to +2%",
  targetPrice: 110,
  stopLossPrice: 95,
  catalystTriggers: ["catalyst"],
  invalidationCondition: "invalidation",
  estimatedFrictionPercent: 0.1,
});

const html = renderToStaticMarkup(
  <TimelineBranchingTree
    timelines={[scenario("BULL", 40), scenario("BASE", 35), scenario("BEAR", 20), scenario("BLACK_SWAN", 5)]}
    activeTimelineId="BASE"
    onSelectTimeline={() => {}}
  />
);

describe("TimelineBranchingTree", () => {
  it("does not wrap its focusable scenario nodes in role=img", () => {
    expect(html).toContain('role="button"'); // the nodes are interactive...
    expect(html).not.toContain('role="img"'); // ...and axe `nested-interactive` forbids an img wrapper
  });

  it("says the weights sum to 100%, never that they are calibrated", () => {
    expect(html).toContain("weights sum to 100%");
    expect(html).not.toMatch(/calibrated/i);
  });
});
