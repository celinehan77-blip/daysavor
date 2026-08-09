"use client";

import Image from "next/image";
import { getStationVisual } from "@/lib/station-visual/matcher";
import type { SerializableRecipe } from "@/types";

export type StationFoodMapClassNames = {
  image?: string;
  imageFrame?: string;
  map?: string;
  unavailable?: string;
};

export function StationFoodMapArtwork({
  classNames = {},
  compact = false,
  imageFailed,
  onImageError,
  recipe,
}: {
  classNames?: StationFoodMapClassNames;
  compact?: boolean;
  imageFailed: boolean;
  onImageError?: () => void;
  recipe: SerializableRecipe;
}) {
  const visual = getStationVisual(recipe);
  const showImage = Boolean(visual.src) && !imageFailed;
  const assetPresentation = /\.png(?:$|[?#])/i.test(visual.src)
    ? "isolated"
    : "photographic";

  return (
    <div
      className={`relative mx-auto mt-6 w-full ${
        compact ? "h-[168px]" : "h-[190px]"
      } ${classNames.map ?? ""}`}
    >
      {showImage ? (
        <div
          className={classNames.imageFrame}
          data-station-asset-presentation={assetPresentation}
          data-station-visual="image"
          data-station-visual-id={visual.assetId}
          data-station-visual-src={visual.src}
        >
          <Image
            alt={`${recipe.titleZh}食材关系图`}
            className={classNames.image}
            fill
            loading={compact ? "lazy" : "eager"}
            onError={onImageError}
            sizes="270px"
            src={visual.src}
            style={{ objectPosition: visual.objectPosition }}
            unoptimized={assetPresentation === "photographic"}
          />
        </div>
      ) : (
        <div
          className={classNames.unavailable}
          data-station-visual="unavailable"
        />
      )}
    </div>
  );
}
