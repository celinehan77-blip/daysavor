import assert from "node:assert/strict";
import test from "node:test";

import {
  COVER_FLOW_CARD_STRIDE,
  getContinuousCoverFlowOffset,
  getCoverFlowTransform,
  getProjectedCardDelta,
  getSnapDurationMs,
} from "../../src/components/station/chickenStationMotion";

test("continuous card offsets let each card pass through the visual center", () => {
  assert.equal(getContinuousCoverFlowOffset(0, 0, 0, 5), 0);
  assert.equal(getContinuousCoverFlowOffset(1, 0, 0.5, 5), 0.5);
  assert.equal(getContinuousCoverFlowOffset(2, 0, 2, 5), 0);
  assert.equal(getContinuousCoverFlowOffset(4, 0, 0.5, 5), -1.5);
});

test("center and side cards have distinct continuous 3D depth", () => {
  const center = getCoverFlowTransform(0);
  const midpoint = getCoverFlowTransform(0.5);
  const right = getCoverFlowTransform(1);
  const left = getCoverFlowTransform(-1);

  assert.deepEqual(
    {
      scale: center.scale,
      opacity: center.opacity,
      rotateY: center.rotateY,
      z: center.z,
      blur: center.blur,
      brightness: center.brightness,
    },
    {
      scale: 1,
      opacity: 1,
      rotateY: 0,
      z: 0,
      blur: 0,
      brightness: 1,
    },
  );

  assert.ok(midpoint.scale < center.scale && midpoint.scale > right.scale);
  assert.ok(midpoint.z < center.z && midpoint.z > right.z);
  assert.ok(midpoint.blur > center.blur && midpoint.blur < right.blur);
  assert.ok(right.rotateY < 0, "right card should turn inward");
  assert.ok(left.rotateY > 0, "left card should turn inward");
  assert.ok(right.z < 0, "side card should sit behind the center card");
  assert.ok(right.brightness < 1);
  assert.ok(right.shadowOpacity < center.shadowOpacity);
  assert.equal(
    getCoverFlowTransform(2).opacity,
    0,
    "cards beyond the adjacent layer should leave the composited scene",
  );
});

test("slow gestures either return or move exactly one card", () => {
  assert.equal(
    getProjectedCardDelta({
      dragOffset: -COVER_FLOW_CARD_STRIDE * 0.2,
      velocity: -120,
      totalCards: 5,
    }),
    0,
  );

  assert.equal(
    getProjectedCardDelta({
      dragOffset: -COVER_FLOW_CARD_STRIDE * 0.52,
      velocity: -180,
      totalCards: 5,
    }),
    1,
  );
});

test("medium and fast flicks can advance multiple cards without looping", () => {
  assert.equal(
    getProjectedCardDelta({
      dragOffset: -38,
      velocity: -760,
      totalCards: 5,
    }),
    2,
  );

  assert.equal(
    getProjectedCardDelta({
      dragOffset: -52,
      velocity: -1_650,
      totalCards: 5,
    }),
    3,
  );

  assert.equal(
    getProjectedCardDelta({
      dragOffset: 52,
      velocity: 1_650,
      totalCards: 5,
    }),
    -3,
  );

  assert.equal(
    getProjectedCardDelta({
      dragOffset: -52,
      velocity: -1_650,
      totalCards: 3,
    }),
    2,
  );
});

test("snap timing stays inside the requested motion window", () => {
  assert.equal(getSnapDurationMs(0, 0), 250);
  assert.ok(getSnapDurationMs(1, 250) >= 250);
  assert.ok(getSnapDurationMs(3, 1_650) <= 450);
});
