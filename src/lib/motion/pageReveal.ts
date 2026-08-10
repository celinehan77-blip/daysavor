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
