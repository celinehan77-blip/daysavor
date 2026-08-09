"use client";

import { useState } from "react";
import Image from "next/image";

import { RECIPE_VISUAL_FALLBACK } from "@/lib/recipe-visual/matcher";

type RecipeAssetImageProps = {
  alt: string;
  className: string;
  objectPosition?: string;
  presentation?: RecipeAssetPresentation;
  priority?: boolean;
  sizes: string;
  src: string;
};

export type RecipeAssetPresentation = "isolated" | "photographic";

export function getRecipeAssetPresentation(
  _src: string,
  presentation: RecipeAssetPresentation = "photographic",
): RecipeAssetPresentation {
  return presentation;
}

export function RecipeAssetImage({
  alt,
  className,
  objectPosition,
  presentation = "photographic",
  priority = false,
  sizes,
  src,
}: RecipeAssetImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <Image
      src={currentSrc}
      alt={alt}
      data-asset-presentation={getRecipeAssetPresentation(
        currentSrc,
        presentation,
      )}
      fill
      sizes={sizes}
      className={className}
      style={objectPosition ? { objectPosition } : undefined}
      loading={priority ? "eager" : "lazy"}
      onError={() => {
        if (currentSrc !== RECIPE_VISUAL_FALLBACK) {
          setCurrentSrc(RECIPE_VISUAL_FALLBACK);
        }
      }}
    />
  );
}
