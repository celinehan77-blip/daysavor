import type { LucideIcon } from "lucide-react";
import type {
  ClassificationSource,
  RecipeCategoryId,
} from "@/types/classification";

export type {
  ChefCategoryViewModel,
  ClassificationSource,
  RecipeCategoryId,
} from "@/types/classification";

export type TabKey = "home" | "favorites" | "flavor-map" | "profile";

export type StationCategoryType = "poultry" | "pasture" | "seafood";

export type StationAccentColor = "sage" | "caramel" | "blue";

export type IngredientGroup = "main" | "side" | "seasoning";

export type RecipeCoverType = "illustration" | "photo" | "ticket";

export type Station = {
  id: string;
  slug: string;
  nameZh: string;
  nameEn: string;
  description: string;
  recipeCount: number;
  averageTime: string;
  difficulty: string;
  categoryType: StationCategoryType;
  accentColor: StationAccentColor;
  route: string;
  icon: LucideIcon;
};

export type Ingredient = {
  id: string;
  name: string;
  amount: string;
  group: IngredientGroup;
  note: string;
};

export type RecipeStep = {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: LucideIcon;
  tips: string;
};

export type SerializableRecipeStep = Omit<RecipeStep, "icon">;

export type Recipe = {
  id: string;
  slug: string;
  titleZh: string;
  titleEn: string;
  stationId: string;
  coverType: RecipeCoverType;
  timeMinutes: number;
  difficulty: string;
  flavor: string;
  mainIngredient: string;
  primaryCategory?: RecipeCategoryId;
  primaryIngredient?: string;
  classificationConfidence?: number;
  classificationReason?: string;
  classificationSource?: ClassificationSource;
  tags: string[];
  description: string;
  ingredients: Ingredient[];
  seasonings: Ingredient[];
  steps: RecipeStep[];
  savedCount: number;
};

export type SerializableStation = Omit<Station, "icon">;

export type SerializableRecipe = Omit<Recipe, "steps"> & {
  steps: SerializableRecipeStep[];
};

export type TabItem = {
  id: TabKey;
  label: string;
  route: string;
  icon: LucideIcon;
};

export type RecentRecipe = {
  title: string;
  subtitle: string;
};

export type LoadingStep = {
  label: string;
  active: boolean;
};
