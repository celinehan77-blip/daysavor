"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart3,
  Bookmark,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  Clock3,
  Flame,
  Heart,
  MoreHorizontal,
  Share2,
} from "lucide-react";
import { AppViewport } from "@/components/layout/AppViewport";
import { IngredientPrepCard } from "@/components/recipe/IngredientPrepCard";
import { RecipeAssetImage } from "@/components/recipe/RecipeAssetImage";
import { resolveHeroObjectPosition } from "@/components/recipe/ingredientCardLayout";
import styles from "@/components/recipe/RecipeDetail.module.css";
import {
  getHeroVisualSelection,
  getIngredientVisual,
  getProteinVisual,
  getSeasoningVisual,
  getStepImage,
} from "@/lib/recipe-visual/matcher";
import {
  getRecipeDetailBySlug,
  getLocalGeneratedRecipeBySlug,
  isLocalGeneratedRecipeSlug,
  isRecipeFavorite,
  toggleRecipeFavorite,
  updateRecipeClassification,
} from "@/lib/data";
import { serializeRecipe } from "@/lib/data/serializers";
import type { Ingredient, IngredientGroup, SerializableRecipe } from "@/types";
import type { RecipeVisualPresentation } from "@/types/recipeVisual";
import {
  normalizeRecipeCategory,
  recipeCategoryLabels,
} from "@/lib/classification/recipeCategories";
import {
  RECIPE_CATEGORY_IDS,
  type RecipeCategoryId,
} from "@/types/classification";

type RecipeDetailScreenProps = {
  allRecipes: SerializableRecipe[];
  backHref: string;
  recipe: SerializableRecipe | null;
  recipeSlug: string;
};

const statIcons = [Clock3, BarChart3, Flame, ChefHat, Heart];

const bottomActions = [
  { label: "分享", icon: Share2 },
  { label: "收藏", icon: Heart },
];

function getRecipeNo(recipe: SerializableRecipe, recipes: SerializableRecipe[]) {
  const index = recipes.findIndex((item) => item.slug === recipe.slug);
  return String(index + 1 || 1).padStart(2, "0");
}

function FoodStillLife({
  alt,
  objectPosition,
  src,
}: {
  alt: string;
  objectPosition: string;
  src: string;
}) {
  const presentation = /\.png(?:$|[?#])/i.test(src)
    ? "isolated"
    : "photographic";

  return (
    <div className={styles.heroPhoto}>
      <RecipeAssetImage
        src={src}
        alt={alt}
        sizes="(max-width: 430px) 46vw, 190px"
        className={styles.heroPhotoImage}
        objectPosition={
          presentation === "isolated"
            ? "72% 50%"
            : resolveHeroObjectPosition(objectPosition)
        }
        presentation={presentation}
        priority
      />
    </div>
  );
}

function StepThumb({ alt, src }: { alt: string; src: string }) {
  return (
    <div className={styles.stepThumb}>
      <RecipeAssetImage
        src={src}
        alt={alt}
        sizes="42px"
        className={styles.stepThumbImage}
      />
    </div>
  );
}

export function RecipeDetailScreen({
  allRecipes,
  backHref,
  recipe: initialRecipe,
  recipeSlug,
}: RecipeDetailScreenProps) {
  const [resolvedRecipe, setResolvedRecipe] = useState(initialRecipe);
  const [isResolvingRecipe, setIsResolvingRecipe] = useState(!initialRecipe);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState("");
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isClassificationMenuOpen, setIsClassificationMenuOpen] =
    useState(false);
  const [classificationMessage, setClassificationMessage] = useState("");
  const [isClassificationLoading, setIsClassificationLoading] =
    useState(false);
  const favoriteLockRef = useRef(false);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!initialRecipe && isLocalGeneratedRecipeSlug(recipeSlug)) {
        const localRecipe = getLocalGeneratedRecipeBySlug(recipeSlug);
        if (active) {
          setResolvedRecipe(localRecipe ? serializeRecipe(localRecipe) : null);
          setIsResolvingRecipe(false);
        }
      } else if (!initialRecipe) {
        void getRecipeDetailBySlug(recipeSlug).then((clientRecipe) => {
          if (active) {
            setResolvedRecipe(
              clientRecipe ? serializeRecipe(clientRecipe) : null,
            );
            setIsResolvingRecipe(false);
          }
        });
      } else {
        setResolvedRecipe(initialRecipe);
        setIsResolvingRecipe(false);
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [initialRecipe, recipeSlug]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (resolvedRecipe) {
        void isRecipeFavorite(resolvedRecipe.slug).then((favorite) => {
          if (active) {
            setIsFavorite(favorite);
          }
        });
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [resolvedRecipe]);

  const handleToggleFavorite = async () => {
    if (!resolvedRecipe || favoriteLockRef.current) {
      return;
    }

    favoriteLockRef.current = true;
    setIsFavoriteLoading(true);
    setFavoriteMessage("");

    try {
      const nextFavoriteState = await toggleRecipeFavorite(resolvedRecipe.slug);
      setIsFavorite(nextFavoriteState.favorite);
      setFavoriteMessage(nextFavoriteState.message ?? "");
    } finally {
      favoriteLockRef.current = false;
      setIsFavoriteLoading(false);
    }
  };

  const handleClassificationChange = async (
    category: RecipeCategoryId,
  ) => {
    if (!resolvedRecipe || isClassificationLoading) return;

    setIsClassificationLoading(true);
    setClassificationMessage("");

    try {
      const result = await updateRecipeClassification(
        resolvedRecipe.slug,
        category,
      );

      if (!result.ok) {
        setClassificationMessage(result.error ?? "分类修改失败，请稍后重试。");
        return;
      }

      setResolvedRecipe((current) =>
        current
          ? {
              ...current,
              primaryCategory: category,
              classificationConfidence: 1,
              classificationReason: "用户手动修正主要分类",
              classificationSource: "user",
            }
          : current,
      );
      setClassificationMessage(`已归入${recipeCategoryLabels[category]}`);
      setIsClassificationMenuOpen(false);
    } finally {
      setIsClassificationLoading(false);
    }
  };

  if (isResolvingRecipe) {
    return (
      <AppViewport>
        <div className="app-content grid place-items-center px-6 text-center text-[14px] text-[#75695f]">
          正在读取你的菜谱…
        </div>
      </AppViewport>
    );
  }

  if (!resolvedRecipe) {
    return (
      <AppViewport>
        <div className="app-content px-5 pt-8">
          <Link
            href="/flavor-map"
            aria-label="返回风味地图"
            className="recipe-nav-button"
          >
            <ChevronLeft size={24} />
          </Link>
          <section className="paper-card mt-16 rounded-[28px] px-6 py-8 text-center">
            <div className="relative z-10">
              <h1 className="font-display text-[30px] tracking-[0.06em] text-[#3a2a1d]">
                没有找到这道菜
              </h1>
              <p className="mt-3 text-[14px] leading-6 text-[#75695f]">
                回到风味地图，重新选择一张菜谱票根
              </p>
              <Link
                href="/flavor-map"
                className="mx-auto mt-6 flex h-11 w-[142px] items-center justify-center rounded-full bg-[#8b9a7a] text-[14px] font-semibold text-[#fffaf2]"
              >
                返回风味地图
              </Link>
            </div>
          </section>
        </div>
      </AppViewport>
    );
  }

  const recipeNo = getRecipeNo(resolvedRecipe, allRecipes);
  const recipe = resolvedRecipe;
  const heroVisual = getHeroVisualSelection(recipe);
  const recipeStats = [
    { label: "烹饪时间", value: String(recipe.timeMinutes), suffix: "分钟" },
    { label: "难度等级", value: recipe.difficulty },
    { label: "口味特点", value: recipe.flavor },
    { label: "主食材", value: recipe.mainIngredient.split(" · ")[0] },
    { label: "收藏人数", value: String(recipe.savedCount) },
  ];

  const mainIngredients = recipe.ingredients.filter(
    (item) => item.group === "main",
  );
  const sideIngredients = recipe.ingredients.filter(
    (item) => item.group === "side",
  );
  const proteinVisual = getProteinVisual(recipe);
  const ingredientVisual = getIngredientVisual(recipe);
  const seasoningVisual = getSeasoningVisual(recipe);
  const ingredientGroups: {
    id: IngredientGroup;
    image: string;
    presentation: RecipeVisualPresentation;
    title: string;
    items: Ingredient[];
  }[] = [
    {
      id: "main",
      image: proteinVisual.src,
      presentation: proteinVisual.presentation,
      title: "主食材",
      items: mainIngredients,
    },
    {
      id: "side",
      image: ingredientVisual.src,
      presentation: ingredientVisual.presentation,
      title: "配料",
      items: sideIngredients,
    },
    {
      id: "seasoning",
      image: seasoningVisual.src,
      presentation: seasoningVisual.presentation,
      title: "调味料",
      items: recipe.seasonings,
    },
  ];

  return (
    <AppViewport>
      <div className="app-content recipe-detail-scroll pb-24">
        <section className={styles.heroSection}>
          <div className="relative z-30 flex items-center justify-between">
            <Link
              href={backHref}
              aria-label="返回"
              className="recipe-nav-button"
            >
              <ChevronLeft size={24} />
            </Link>
            <div className="flex gap-2.5">
              <button
                aria-label="收藏"
                onClick={handleToggleFavorite}
                disabled={isFavoriteLoading}
                className="recipe-nav-button disabled:opacity-70"
              >
                <Bookmark
                  size={20}
                  className={isFavorite ? "fill-[#8a5a35]/18" : ""}
                />
              </button>
              <button
                aria-label="更多"
                aria-expanded={isClassificationMenuOpen}
                onClick={() =>
                  setIsClassificationMenuOpen((isOpen) => !isOpen)
                }
                className="recipe-nav-button"
              >
                <MoreHorizontal size={22} />
              </button>
            </div>
          </div>

          {isClassificationMenuOpen ? (
            <div className="paper-card absolute right-5 top-16 z-40 w-[190px] rounded-[18px] p-3 text-left shadow-[0_18px_45px_rgba(72,49,30,0.2)]">
              <label
                htmlFor="recipe-primary-category"
                className="relative z-10 block text-[12px] font-semibold text-[#6f5b49]"
              >
                主要分类
              </label>
              <select
                id="recipe-primary-category"
                value={normalizeRecipeCategory(recipe.primaryCategory)}
                disabled={isClassificationLoading}
                onChange={(event) =>
                  void handleClassificationChange(
                    event.target.value as RecipeCategoryId,
                  )
                }
                className="relative z-10 mt-2 h-10 w-full rounded-xl border border-[#d8cabb] bg-[#fffaf2] px-3 text-[13px] text-[#3a2a1d] outline-none"
              >
                {RECIPE_CATEGORY_IDS.map((category) => (
                  <option key={category} value={category}>
                    {recipeCategoryLabels[category]}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className={styles.heroBody}>
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
              className={styles.heroCopy}
            >
              <p className="font-display text-[42px] leading-none text-[#c9b9a9]">
                {recipeNo}
              </p>
              <div className="mt-1.5 h-px w-12 bg-[#8b9a7a]" />
              <h1
                className={`${styles.heroTitle} font-display mt-3 tracking-[0.08em] text-[#3a2a1d]`}
              >
                {recipe.titleZh}
              </h1>
              <p
                className={`${styles.heroEnglish} mt-2 font-serif text-[21px] text-[#8a5a35]`}
              >
                {recipe.titleEn}
              </p>
              <p className={`${styles.heroDescription} text-[#75695f]`}>
                {recipe.description}
              </p>
            </motion.div>

            <FoodStillLife
              src={heroVisual.src}
              alt={recipe.titleZh}
              objectPosition={heroVisual.objectPosition}
            />
          </div>
        </section>

        <motion.section
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.6 }}
          className={`${styles.statsCard} recipe-stats-card mx-5 grid min-h-[68px] grid-cols-5 rounded-[22px] px-1.5 py-2`}
        >
          {recipeStats.map((stat, index) => {
            const Icon = statIcons[index];
            return (
              <div
                key={stat.label}
                className="flex min-h-0 flex-col items-center justify-center border-r border-[#d8cabb]/65 px-1 text-center last:border-r-0"
              >
                <Icon size={16} strokeWidth={1.7} className="text-[#8a8178]" />
                <p className="mt-1 text-[10px] leading-none text-[#8a8178]">{stat.label}</p>
                <p className="mt-1 text-[18px] font-semibold leading-none text-[#6f7d55]">
                  {stat.value}
                </p>
                {stat.suffix ? (
                  <p className="text-[10px] leading-none font-medium text-[#6f7d55]">
                    {stat.suffix}
                  </p>
                ) : null}
              </div>
            );
          })}
        </motion.section>
        {favoriteMessage ? (
          <p className="mx-5 mt-2 rounded-full bg-[#fffaf2]/70 px-3 py-1.5 text-[12px] leading-5 text-[#8a5a35]">
            {favoriteMessage}
          </p>
        ) : null}
        {classificationMessage ? (
          <p className="mx-5 mt-2 rounded-full bg-[#fffaf2]/70 px-3 py-1.5 text-[12px] leading-5 text-[#8a5a35]">
            {classificationMessage}
          </p>
        ) : null}

        <section className="mt-3 px-5">
          <div className="mb-2 flex h-9 items-end justify-between px-1">
            <div>
              <h2 className="font-display text-[20px] tracking-[0.06em] text-[#3a2a1d]">
                食材准备
              </h2>
              <div className="mt-1 h-0.5 w-10 rounded-full bg-[#8b9a7a]" />
            </div>
            <button className="flex items-center gap-1 text-[13px] text-[#5a4636]">
              2 人份
              <ChevronDown size={15} />
            </button>
          </div>

          <div className={styles.ingredientGrid}>
            {ingredientGroups.map((group, index) => (
              <IngredientPrepCard
                key={group.id}
                type={group.id}
                title={group.title}
                items={group.items}
                image={group.image}
                artworkPresentation={group.presentation}
                index={index}
              />
            ))}
          </div>
        </section>

        <section className="mt-3 px-5">
          <div className="mb-2 px-1">
            <h2 className="font-display text-[20px] tracking-[0.06em] text-[#3a2a1d]">
              烹饪步骤
            </h2>
            <div className="mt-1 h-0.5 w-10 rounded-full bg-[#8b9a7a]" />
          </div>

          <div className="recipe-steps-card rounded-[22px] px-3 py-2">
            {recipe.steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={false}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: index * 0.05, duration: 0.42 }}
                className="relative flex min-h-[58px] items-center gap-2.5 border-b border-[#dfd1c1]/70 py-1 last:border-b-0"
              >
                {index < recipe.steps.length - 1 ? (
                  <span className="absolute left-[13px] top-[38px] h-[28px] border-l border-dashed border-[#c9bcae]" />
                ) : null}
                <span className="relative z-10 grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-[#8b9a7a] text-[12px] font-semibold text-[#fffaf2] shadow-[0_6px_12px_rgba(99,114,75,0.18)]">
                  {index + 1}
                </span>
                <StepThumb
                  src={getStepImage(recipe, step, index)}
                  alt={`步骤${index + 1}：${step.title}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-display text-[15px] leading-5 text-[#3a2a1d]">
                      {step.title}
                    </h3>
                    <span className="h-7 shrink-0 rounded-full bg-[#f4eadc] px-2.5 text-[11px] font-medium leading-7 text-[#6a5748]">
                      {step.duration}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] leading-4 text-[#8a8178]">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      <div className="safe-bottom pointer-events-none absolute inset-x-0 bottom-0 z-40 mx-auto px-[26px]">
        <div
          className={`${styles.actionBar} recipe-action-bar pointer-events-auto grid h-[68px] items-center rounded-[28px] px-2 text-[#8b7e72]`}
        >
          {bottomActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                className="flex flex-col items-center gap-0.5 text-[11px]"
              >
                <Icon size={20} strokeWidth={1.8} />
                {action.label}
              </button>
            );
          })}
          <button
            onClick={handleToggleFavorite}
            disabled={isFavoriteLoading}
            className={`${styles.primaryAction} flex h-11 items-center justify-center gap-1.5 justify-self-center rounded-full text-[14px] font-semibold tracking-[0.03em] text-[#fffaf2] shadow-[0_12px_24px_rgba(91,105,64,0.22)] ${
              isFavorite ? "bg-[#6f7d55]" : "bg-[#8b9a7a]"
            } disabled:opacity-70`}
          >
            <Bookmark size={18} className={isFavorite ? "fill-[#fffaf2]/24" : ""} />
            {isFavoriteLoading ? "处理中" : isFavorite ? "已收藏" : "加入收藏"}
          </button>
        </div>
      </div>
    </AppViewport>
  );
}
