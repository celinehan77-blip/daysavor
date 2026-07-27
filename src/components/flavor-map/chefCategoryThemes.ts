import type { RecipeCategoryId } from "@/types/classification";

export type ChefCategoryTheme = {
  paper: string;
  accent: string;
  text: string;
};

export const chefCategoryThemes = {
  chicken: {
    paper: "#E1E1CC",
    accent: "#6F795D",
    text: "#3D3025",
  },
  duck: {
    paper: "#E6D7AE",
    accent: "#8A7544",
    text: "#443629",
  },
  pork: {
    paper: "#E7D0C7",
    accent: "#A06F60",
    text: "#4B342E",
  },
  beef: {
    paper: "#E5C7A3",
    accent: "#925B32",
    text: "#493326",
  },
  lamb: {
    paper: "#D9D0C0",
    accent: "#756858",
    text: "#40362D",
  },
  fish: {
    paper: "#D7E1E8",
    accent: "#55778A",
    text: "#294A59",
  },
  shrimp: {
    paper: "#E8D0BE",
    accent: "#B36F52",
    text: "#53372D",
  },
  crab: {
    paper: "#DFC1B3",
    accent: "#9C5645",
    text: "#4E3029",
  },
  other: {
    paper: "#DDD9D0",
    accent: "#777168",
    text: "#3F3A34",
  },
} as const satisfies Record<RecipeCategoryId, ChefCategoryTheme>;

