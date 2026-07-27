"use client";

import { useEffect, useState } from "react";
import { ChickenStationScreen } from "@/components/station/ChickenStationScreen";
import {
  buildCategoryStation,
  filterRecipesByCategory,
} from "@/lib/classification/recipeCategories";
import { getPersonalRecipes } from "@/lib/data";
import { serializeRecipes } from "@/lib/data/serializers";
import type { Recipe } from "@/types";
import type { RecipeCategoryId } from "@/types/classification";

export function ChefCategoryScreen({
  category,
}: {
  category: RecipeCategoryId;
}) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    let active = true;

    void getPersonalRecipes().then((personalRecipes) => {
      if (active) {
        setRecipes(filterRecipesByCategory(personalRecipes, category));
      }
    });

    return () => {
      active = false;
    };
  }, [category]);

  return (
    <ChickenStationScreen
      station={buildCategoryStation(category, recipes)}
      recipes={serializeRecipes(recipes)}
    />
  );
}
