type RevealTarget = {
  opacity: number;
  y: number;
  scale: number;
};

type RevealTransition = {
  delay: number;
  duration: number;
  ease: [number, number, number, number];
};

type SurfaceRevealTarget = Omit<RevealTarget, "scale">;

export type SurfaceRevealMotion = {
  initial: SurfaceRevealTarget;
  whileInView: SurfaceRevealTarget;
  viewport: {
    once: true;
    amount: 0.16;
    margin: "0px 0px -6% 0px";
  };
  transition: RevealTransition;
};

export type PageRevealMotion = {
  initial: RevealTarget;
  animate: RevealTarget;
  transition: RevealTransition;
};

const revealEase: RevealTransition["ease"] = [0.22, 1, 0.36, 1];
const visibleTarget: RevealTarget = { opacity: 1, y: 0, scale: 1 };

export function getPageRevealMotion(
  index: number,
  reducedMotion: boolean,
): PageRevealMotion {
  if (reducedMotion) {
    return {
      initial: visibleTarget,
      animate: visibleTarget,
      transition: { delay: 0, duration: 0.01, ease: revealEase },
    };
  }

  const sequenceIndex = Math.max(0, Math.floor(index));

  return {
    initial: { opacity: 0, y: 16, scale: 0.992 },
    animate: visibleTarget,
    transition: {
      delay: Number((0.03 + sequenceIndex * 0.065).toFixed(3)),
      duration: 0.46,
      ease: revealEase,
    },
  };
}

const visibleSurfaceTarget: SurfaceRevealTarget = { opacity: 1, y: 0 };
const surfaceEase: RevealTransition["ease"] = [0.16, 1, 0.3, 1];
const surfaceViewport: SurfaceRevealMotion["viewport"] = {
  once: true,
  amount: 0.16,
  margin: "0px 0px -6% 0px",
};

/**
 * Reveals paint-heavy paper surfaces only when they enter the viewport.
 * Keeping scale out of this animation lets the browser reuse the ticket's
 * already-rasterized texture and shadow instead of repainting it every frame.
 */
export function getSurfaceRevealMotion(
  index: number,
  reducedMotion: boolean,
): SurfaceRevealMotion {
  if (reducedMotion) {
    return {
      initial: visibleSurfaceTarget,
      whileInView: visibleSurfaceTarget,
      viewport: surfaceViewport,
      transition: { delay: 0, duration: 0.01, ease: surfaceEase },
    };
  }

  const sequenceIndex = Math.min(5, Math.max(0, Math.floor(index)));

  return {
    initial: { opacity: 0, y: 12 },
    whileInView: visibleSurfaceTarget,
    viewport: surfaceViewport,
    transition: {
      delay: Number((0.04 + sequenceIndex * 0.065).toFixed(3)),
      duration: 0.52,
      ease: surfaceEase,
    },
  };
}
