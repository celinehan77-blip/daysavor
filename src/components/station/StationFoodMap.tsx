"use client";

import { useState } from "react";
import { getStationVisual } from "@/lib/station-visual/matcher";
import type { SerializableRecipe } from "@/types";
import {
  StationFoodMapArtwork,
  type StationFoodMapClassNames,
} from "./StationFoodMapArtwork";
import styles from "./StationFoodMap.module.css";

const classNames: StationFoodMapClassNames = styles;

export function StationFoodMap({
  compact = false,
  recipe,
}: {
  compact?: boolean;
  recipe: SerializableRecipe;
}) {
  const visual = getStationVisual(recipe);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageFailed = failedSrc === visual.src;

  return (
    <StationFoodMapArtwork
      classNames={classNames}
      compact={compact}
      imageFailed={imageFailed}
      onImageError={() => setFailedSrc(visual.src)}
      recipe={recipe}
    />
  );
}
