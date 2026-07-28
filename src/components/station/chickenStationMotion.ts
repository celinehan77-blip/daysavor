export const COVER_FLOW_CARD_STRIDE = 132;

const SLOW_VELOCITY = 420;
const FAST_VELOCITY = 1_100;
const SLOW_DISTANCE_THRESHOLD = 0.42;
const INERTIA_PROJECTION_SECONDS = 0.18;

type ProjectedCardDeltaInput = {
  dragOffset: number;
  velocity: number;
  totalCards: number;
};

export type CoverFlowTransform = {
  x: number;
  y: number;
  z: number;
  rotateY: number;
  scale: number;
  opacity: number;
  blur: number;
  brightness: number;
  shadowOpacity: number;
  zIndex: number;
};

type TransformAnchor = Omit<CoverFlowTransform, "x" | "rotateY"> & {
  x: number;
  rotateY: number;
};

const CENTER_ANCHOR: TransformAnchor = {
  x: 0,
  y: 0,
  z: 0,
  rotateY: 0,
  scale: 1,
  opacity: 1,
  blur: 0,
  brightness: 1,
  shadowOpacity: 0.28,
  zIndex: 100,
};

const SIDE_ANCHOR: TransformAnchor = {
  x: 142,
  y: 28,
  z: -150,
  rotateY: -34,
  scale: 0.84,
  opacity: 0.72,
  blur: 0.45,
  brightness: 0.84,
  shadowOpacity: 0.14,
  zIndex: 70,
};

const FAR_ANCHOR: TransformAnchor = {
  x: 205,
  y: 52,
  z: -270,
  rotateY: -52,
  scale: 0.7,
  opacity: 0,
  blur: 0.9,
  brightness: 0.72,
  shadowOpacity: 0,
  zIndex: 40,
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

const interpolate = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

function interpolateAnchor(
  from: TransformAnchor,
  to: TransformAnchor,
  progress: number,
): TransformAnchor {
  return {
    x: interpolate(from.x, to.x, progress),
    y: interpolate(from.y, to.y, progress),
    z: interpolate(from.z, to.z, progress),
    rotateY: interpolate(from.rotateY, to.rotateY, progress),
    scale: interpolate(from.scale, to.scale, progress),
    opacity: interpolate(from.opacity, to.opacity, progress),
    blur: interpolate(from.blur, to.blur, progress),
    brightness: interpolate(from.brightness, to.brightness, progress),
    shadowOpacity: interpolate(
      from.shadowOpacity,
      to.shadowOpacity,
      progress,
    ),
    zIndex: interpolate(from.zIndex, to.zIndex, progress),
  };
}

export function getContinuousCoverFlowOffset(
  cardIndex: number,
  activeIndex: number,
  progress: number,
  totalCards: number,
) {
  if (totalCards <= 1) {
    return 0;
  }

  const rawOffset = cardIndex - activeIndex - progress;
  const half = totalCards / 2;

  return ((((rawOffset + half) % totalCards) + totalCards) % totalCards) - half;
}

export function getCoverFlowTransform(offset: number): CoverFlowTransform {
  const direction = offset < 0 ? -1 : 1;
  const distance = Math.abs(offset);
  let anchor: TransformAnchor;

  if (distance <= 1) {
    anchor = interpolateAnchor(CENTER_ANCHOR, SIDE_ANCHOR, distance);
  } else {
    anchor = interpolateAnchor(
      SIDE_ANCHOR,
      FAR_ANCHOR,
      clamp(distance - 1, 0, 1),
    );
  }

  return {
    ...anchor,
    x: anchor.x * direction,
    rotateY: anchor.rotateY * direction,
    zIndex: Math.round(anchor.zIndex),
  };
}

export function getProjectedCardDelta({
  dragOffset,
  velocity,
  totalCards,
}: ProjectedCardDeltaInput) {
  if (totalCards <= 1) {
    return 0;
  }

  const speed = Math.abs(velocity);
  const maximumTravel = Math.min(3, totalCards - 1);
  let steps = 0;
  let projectedOffset = dragOffset;

  if (speed < SLOW_VELOCITY) {
    const distanceInCards = Math.abs(dragOffset) / COVER_FLOW_CARD_STRIDE;
    steps = distanceInCards >= SLOW_DISTANCE_THRESHOLD ? 1 : 0;
  } else {
    projectedOffset += velocity * INERTIA_PROJECTION_SECONDS;
    const projectedCards =
      Math.abs(projectedOffset) / COVER_FLOW_CARD_STRIDE;

    if (speed < FAST_VELOCITY) {
      steps = clamp(Math.ceil(projectedCards), 1, 2);
    } else {
      steps = clamp(Math.round(projectedCards), 2, 3);
    }
  }

  if (steps === 0) {
    return 0;
  }

  const directionSource =
    speed < SLOW_VELOCITY ? dragOffset : projectedOffset;
  const direction = directionSource < 0 ? 1 : -1;

  return direction * Math.min(steps, maximumTravel);
}

export function getSnapDurationMs(cardDelta: number, velocity: number) {
  const distanceCost = Math.abs(cardDelta) * 55;
  const velocityReduction = Math.min(Math.abs(velocity) / 30, 55);

  return Math.round(clamp(250 + distanceCost - velocityReduction, 250, 450));
}
