"use client";

import { useEffect, useState } from "react";
import { getChefCategories } from "@/lib/data/recipeClassification";
import type { ChefCategoryViewModel } from "@/types/classification";

type UseChefCategoriesResult = {
  categories: ChefCategoryViewModel[];
  error: string | null;
  isLoading: boolean;
};

/**
 * UI-safe client hook for the flavor-map visual layer.
 * It deliberately exposes view models only; data-source details stay private.
 */
export function useChefCategories(): UseChefCategoriesResult {
  const [categories, setCategories] = useState<ChefCategoryViewModel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void getChefCategories()
      .then((nextCategories) => {
        if (active) {
          setCategories(nextCategories);
        }
      })
      .catch(() => {
        if (active) {
          setError("分类数据暂时不可用。");
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return { categories, error, isLoading };
}
