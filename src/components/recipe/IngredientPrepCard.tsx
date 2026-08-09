"use client";

import { motion } from "framer-motion";

import {
  RecipeAssetImage,
  type RecipeAssetPresentation,
} from "@/components/recipe/RecipeAssetImage";
import {
  getIngredientCardLayoutMode,
  normalizeIngredientCardItems,
  type IngredientCardType,
} from "@/components/recipe/ingredientCardLayout";
import styles from "@/components/recipe/RecipeDetail.module.css";
import type { Ingredient } from "@/types";

type IngredientPrepCardProps = {
  artworkPresentation?: RecipeAssetPresentation;
  image: string;
  index: number;
  items: Ingredient[];
  title: string;
  type: IngredientCardType;
};

function IngredientArtwork({
  alt,
  presentation,
  src,
}: {
  alt: string;
  presentation: RecipeAssetPresentation;
  src: string;
}) {
  return (
    <div className={styles.ingredientPhoto}>
      <div className={styles.ingredientArtworkSurface}>
        <RecipeAssetImage
          src={src}
          alt={alt}
          sizes="(max-width: 430px) 18vw, 78px"
          className={styles.ingredientPhotoImage}
          presentation={presentation}
        />
      </div>
    </div>
  );
}

export function IngredientPrepCard({
  artworkPresentation = "photographic",
  image,
  index,
  items,
  title,
  type,
}: IngredientPrepCardProps) {
  const normalizedItems = normalizeIngredientCardItems(items);
  const layoutMode = getIngredientCardLayoutMode({
    type,
    items: normalizedItems,
  });

  return (
    <motion.article
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.08, duration: 0.45 }}
      className={`${styles.ingredientCard} recipe-ingredient-card rounded-[18px]`}
      data-layout-mode={layoutMode}
      data-ingredient-type={type}
    >
      <div className={styles.ingredientTextArea}>
        <h3 className="font-display text-[16px] tracking-[0.04em] text-[#3a2a1d]">
          {title}
        </h3>
        <div className={styles.ingredientText}>
          {normalizedItems.map((item) => (
            <p
              key={`${type}-${item.id}`}
              className={styles.ingredientLine}
              title={`${item.name} ${item.amount}`}
            >
              {item.name} {item.amount}
            </p>
          ))}
        </div>
      </div>
      <IngredientArtwork
        src={image}
        alt={`${title}食材组合`}
        presentation={artworkPresentation}
      />
    </motion.article>
  );
}
