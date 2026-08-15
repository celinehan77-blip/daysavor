import assert from "node:assert/strict";
import test from "node:test";
import {
  getPageRevealMotion,
  getSurfaceRevealMotion,
} from "../../src/lib/motion/pageReveal";

test("page reveal gives every item a unique top-to-bottom start time", () => {
  const delays = Array.from({ length: 11 }, (_, index) =>
    getPageRevealMotion(index, false).transition.delay,
  );

  assert.equal(delays[0], 0.03);

  for (let index = 1; index < delays.length; index += 1) {
    assert.ok(delays[index] > delays[index - 1]);
    assert.ok(delays[index] - delays[index - 1] <= 0.07);
  }

  assert.ok(delays.at(-1)! < 0.75);
});

test("page reveal only interpolates compositor-friendly properties", () => {
  const motion = getPageRevealMotion(2, false);

  assert.deepEqual(motion.initial, {
    opacity: 0,
    y: 16,
    scale: 0.992,
  });
  assert.deepEqual(motion.animate, {
    opacity: 1,
    y: 0,
    scale: 1,
  });
  assert.deepEqual(motion.transition.ease, [0.22, 1, 0.36, 1]);
  assert.ok(motion.transition.duration >= 0.4);
  assert.ok(motion.transition.duration <= 0.5);
  assert.doesNotMatch(JSON.stringify(motion), /filter|blur|boxShadow/);
});

test("page reveal becomes immediate when reduced motion is requested", () => {
  const motion = getPageRevealMotion(5, true);

  assert.deepEqual(motion.initial, motion.animate);
  assert.equal(motion.transition.delay, 0);
  assert.equal(motion.transition.duration, 0.01);
});

test("heavy paper surfaces reveal without scale rasterization", () => {
  const motion = getSurfaceRevealMotion(2, false);

  assert.deepEqual(motion.initial, { opacity: 0, y: 12 });
  assert.deepEqual(motion.whileInView, { opacity: 1, y: 0 });
  assert.deepEqual(motion.transition.ease, [0.16, 1, 0.3, 1]);
  assert.ok(motion.transition.duration >= 0.5);
  assert.ok(motion.transition.duration <= 0.56);
  assert.doesNotMatch(JSON.stringify(motion), /scale|filter|blur|boxShadow/);
});

test("heavy paper surfaces only animate in view and cap their stagger", () => {
  const first = getSurfaceRevealMotion(0, false);
  const farBelowFold = getSurfaceRevealMotion(12, false);

  assert.deepEqual(first.viewport, {
    once: true,
    amount: 0.16,
    margin: "0px 0px -6% 0px",
  });
  assert.ok(farBelowFold.transition.delay <= 0.38);
});

test("heavy surface reveal becomes immediate for reduced motion", () => {
  const motion = getSurfaceRevealMotion(4, true);

  assert.deepEqual(motion.initial, motion.whileInView);
  assert.equal(motion.transition.delay, 0);
  assert.equal(motion.transition.duration, 0.01);
});
