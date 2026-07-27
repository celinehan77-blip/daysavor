import { notFound } from "next/navigation";
import { ChefCategoryScreen } from "@/components/station/ChefCategoryScreen";
import { isRecipeCategoryId } from "@/lib/classification/recipeCategories";
import { RECIPE_CATEGORY_IDS } from "@/types/classification";

type ChefCategoryPageProps = {
  params: Promise<{
    categoryId: string;
  }>;
};

export function generateStaticParams() {
  return RECIPE_CATEGORY_IDS.map((categoryId) => ({ categoryId }));
}

export default async function ChefCategoryPage({
  params,
}: ChefCategoryPageProps) {
  const { categoryId } = await params;

  if (!isRecipeCategoryId(categoryId)) {
    notFound();
  }

  return <ChefCategoryScreen category={categoryId} />;
}
