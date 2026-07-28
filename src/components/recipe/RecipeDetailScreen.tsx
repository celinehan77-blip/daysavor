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
  NotebookPen,
  Share2,
} from "lucide-react";
import { AppViewport } from "@/components/layout/AppViewport";
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

const peanuts = [
  ["18%", "31%", "-16deg"],
  ["32%", "22%", "12deg"],
  ["48%", "34%", "-8deg"],
  ["63%", "24%", "18deg"],
  ["72%", "42%", "-20deg"],
  ["28%", "52%", "8deg"],
  ["52%", "58%", "-12deg"],
  ["40%", "70%", "16deg"],
  ["66%", "70%", "-6deg"],
];

const peppercorns = [
  ["24%", "42%"],
  ["31%", "62%"],
  ["50%", "30%"],
  ["61%", "54%"],
  ["76%", "44%"],
  ["68%", "74%"],
  ["43%", "78%"],
];

const bottomActions = [
  { label: "分享", icon: Share2 },
  { label: "收藏", icon: Heart },
  { label: "记笔记", icon: NotebookPen },
];

function getRecipeNo(recipe: SerializableRecipe, recipes: SerializableRecipe[]) {
  const index = recipes.findIndex((item) => item.slug === recipe.slug);
  return String(index + 1 || 1).padStart(2, "0");
}

function FoodStillLife() {
  return (
    <div className="recipe-hero-photo pointer-events-none absolute -right-2 top-[58px] h-[186px] w-[190px]">
      <div className="absolute right-0 top-0 h-[108px] w-[128px] rotate-[9deg] rounded-[38px] border border-[#d0b996]/45 bg-[#efe0ca] shadow-[0_18px_30px_rgba(83,55,31,0.13)]">
        <span className="absolute inset-2.5 rounded-[30px] bg-[#fbefe2]" />
        {[
          ["22%", "34%", "-10deg"],
          ["42%", "28%", "8deg"],
          ["58%", "42%", "-14deg"],
          ["34%", "58%", "12deg"],
          ["54%", "67%", "-7deg"],
        ].map(([left, top, rotate], index) => (
          <span
            key={`hero-chicken-${index}`}
            className="absolute z-10 h-6 w-8 rounded-[13px] bg-[#efb39a] shadow-[inset_0_-5px_9px_rgba(174,94,66,0.16),0_5px_10px_rgba(102,58,34,0.1)]"
            style={{ left, top, transform: `rotate(${rotate})` }}
          />
        ))}
      </div>

      <div className="absolute right-[66px] top-[82px] h-[92px] w-[106px] rotate-[-10deg] rounded-full border border-[#d0b996]/45 bg-[#ead9bf] shadow-[0_14px_24px_rgba(83,55,31,0.12)]">
        <span className="absolute inset-2.5 rounded-full bg-[#fff2df]" />
        {peanuts.map(([left, top, rotate], index) => (
          <span
            key={`hero-peanut-${index}`}
            className="absolute z-10 h-3 w-5 rounded-[999px] bg-[#c9874c] shadow-[inset_0_-2px_4px_rgba(116,70,34,0.2)]"
            style={{ left, top, transform: `rotate(${rotate})` }}
          />
        ))}
      </div>

      {[
        ["24px", "68px", "-29deg"],
        ["50px", "91px", "-12deg"],
        ["16px", "118px", "15deg"],
        ["82px", "76px", "22deg"],
        ["72px", "139px", "-35deg"],
      ].map(([left, top, rotate], index) => (
        <span
          key={`hero-chili-${index}`}
          className="absolute h-3 w-16 rounded-full bg-gradient-to-r from-[#8d1e16] via-[#c33a2a] to-[#8d1e16] shadow-[0_5px_10px_rgba(106,28,18,0.14)]"
          style={{ left, top, transform: `rotate(${rotate})` }}
        />
      ))}

      <span className="absolute bottom-7 right-3 h-2.5 w-[86px] rotate-[-20deg] rounded-full bg-[#86a25d] shadow-[0_4px_8px_rgba(72,94,50,0.1)]" />
      <span className="absolute bottom-2 right-11 h-2.5 w-[92px] rotate-[-24deg] rounded-full bg-[#6f924d] shadow-[0_4px_8px_rgba(72,94,50,0.1)]" />
      <span className="absolute right-3 top-[122px] h-12 w-12 rounded-full border-[8px] border-[#fbefe2] bg-[#7a2f20] shadow-[0_12px_22px_rgba(83,55,31,0.1)]" />

      {peppercorns.map(([left, top], index) => (
        <span
          key={`hero-pepper-${index}`}
          className="absolute h-2 w-2 rounded-full bg-[#61402b] shadow-[0_2px_4px_rgba(80,52,32,0.18)]"
          style={{ left, top }}
        />
      ))}
    </div>
  );
}

function IngredientArt({ id }: { id: IngredientGroup }) {
  if (id === "main") {
    return (
      <div className="ingredient-photo relative mt-auto h-[46px] overflow-hidden rounded-[14px] bg-[#ead8c1]">
        <div className="absolute left-2 top-3 h-8 w-16 rounded-full bg-[#f8eadb] shadow-inner" />
        {[
          ["18px", "22px", "-10deg"],
          ["38px", "17px", "12deg"],
          ["54px", "27px", "-4deg"],
          ["28px", "32px", "8deg"],
        ].map(([left, top, rotate], index) => (
          <span
            key={`main-${index}`}
            className="absolute h-4 w-6 rounded-[10px] bg-[#efad92]"
            style={{ left, top, transform: `rotate(${rotate})` }}
          />
        ))}
        <span className="absolute right-5 top-4 h-5 w-5 rounded-full bg-[#8b9a7a]/75" />
        <span className="absolute right-2 top-6 h-6 w-3 rotate-[42deg] rounded-full bg-[#8b9a7a]/65" />
      </div>
    );
  }

  if (id === "side") {
    return (
      <div className="ingredient-photo relative mt-auto h-[46px] overflow-hidden rounded-[14px] bg-[#efe1cf]">
        <div className="absolute right-1 top-2 h-8 w-10 rounded-full bg-[#f8ecd9] shadow-inner" />
        {peanuts.slice(0, 6).map(([left, top], index) => (
          <span
            key={`side-peanut-${index}`}
            className="absolute h-2 w-3.5 rotate-[-18deg] rounded-full bg-[#c98c4f]"
            style={{ left, top }}
          />
        ))}
        <span className="absolute left-3 top-[25px] h-2.5 w-12 rotate-[-22deg] rounded-full bg-[#b92a1f]" />
        <span className="absolute left-6 top-[34px] h-2.5 w-10 rotate-[18deg] rounded-full bg-[#cb3726]" />
        <span className="absolute bottom-2 right-7 h-2.5 w-9 rotate-[-8deg] rounded-full bg-[#7e9f55]" />
      </div>
    );
  }

  return (
    <div className="ingredient-photo relative mt-auto h-[46px] overflow-hidden rounded-[14px] bg-[#f0e2d1]">
      {[
        ["9px", "9px", "#5b2c1b"],
        ["38px", "9px", "#b63720"],
        ["25px", "27px", "#d68c36"],
        ["60px", "25px", "#f5f0e8"],
      ].map(([left, top, color], index) => (
        <span
          key={`seasoning-${index}`}
          className="absolute h-6 w-6 rounded-full border-[4px] border-[#f8efe4] shadow-[0_5px_10px_rgba(80,52,32,0.1)]"
          style={{ left, top, backgroundColor: color }}
        />
      ))}
    </div>
  );
}

function StepThumb({ index }: { index: number }) {
  const tones = [
    "bg-[#f0b69b]",
    "bg-[#7a2e1d]",
    "bg-[#c53a28]",
    "bg-[#d77a35]",
    "bg-[#a54824]",
  ];

  return (
    <div className="step-thumb relative h-10 w-10 shrink-0 overflow-hidden rounded-[13px] bg-[#efe3d3] shadow-inner">
      <span className={`absolute left-2 top-3 h-4 w-6 rounded-full ${tones[index]}`} />
      <span className="absolute right-1.5 top-2 h-2.5 w-2.5 rounded-full bg-[#c98c4f]" />
      <span className="absolute bottom-1.5 left-4 h-1.5 w-5 rounded-full bg-[#8b9a7a]" />
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
  const recipeStats = [
    { label: "烹饪时间", value: String(recipe.timeMinutes), suffix: "分钟" },
    { label: "难度等级", value: recipe.difficulty },
    { label: "口味特点", value: recipe.flavor },
    { label: "主食材", value: recipe.mainIngredient.split(" · ")[0] },
    { label: "收藏人数", value: String(recipe.savedCount) },
  ];

  const ingredientGroups: {
    id: IngredientGroup;
    title: string;
    items: Ingredient[];
  }[] = [
    {
      id: "main",
      title: "主食材",
      items: recipe.ingredients.filter((item) => item.group === "main"),
    },
    {
      id: "side",
      title: "配料",
      items: recipe.ingredients.filter((item) => item.group === "side"),
    },
    {
      id: "seasoning",
      title: "调味料",
      items: recipe.seasonings,
    },
  ];

  return (
    <AppViewport>

      <div className="app-content recipe-detail-scroll pb-24">
        <section className="relative h-[236px] px-5 pt-2">
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

          <FoodStillLife />

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-20 mt-4 max-w-[214px]"
          >
            <p className="font-display text-[42px] leading-none text-[#c9b9a9]">
              {recipeNo}
            </p>
            <div className="mt-1.5 h-px w-12 bg-[#8b9a7a]" />
            <h1 className="font-display mt-3 text-[38px] leading-none tracking-[0.08em] text-[#3a2a1d]">
              {recipe.titleZh}
            </h1>
            <p className="mt-2 font-serif text-[22px] leading-none text-[#8a5a35]">
              {recipe.titleEn}
            </p>
            <p className="mt-3 line-clamp-2 text-[13px] leading-5 text-[#75695f]">
              {recipe.description}
            </p>
          </motion.div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.6 }}
          className="recipe-stats-card mx-5 mt-2 grid h-[68px] grid-cols-5 rounded-[22px] px-1.5 py-2"
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

          <div className="grid grid-cols-3 gap-2.5">
            {ingredientGroups.map((group, index) => (
              /* Keep cards compact by showing the key visible items for the phone-first layout. */
              <motion.article
                key={group.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + index * 0.08, duration: 0.45 }}
                className="recipe-ingredient-card flex h-[136px] flex-col rounded-[18px] p-2.5"
              >
                <div className="relative z-10 flex min-h-full flex-col">
                  <h3 className="font-display text-[16px] tracking-[0.04em] text-[#3a2a1d]">
                    {group.title}
                  </h3>
                  <div className="mt-1.5 min-h-[48px] space-y-0.5">
                    {(group.id === "main"
                      ? group.items
                      : group.id === "side"
                        ? group.items.slice(0, 3)
                        : group.items.slice(0, 5)
                    ).map((item) => (
                      <p
                        key={`${group.id}-${item.name}`}
                        className="text-[10px] leading-[13px] text-[#69594b]"
                      >
                        {item.name} {item.amount}
                      </p>
                    ))}
                  </div>
                  <IngredientArt id={group.id} />
                </div>
              </motion.article>
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
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: index * 0.05, duration: 0.42 }}
                className="relative flex h-[51px] items-center gap-2.5 border-b border-[#dfd1c1]/70 last:border-b-0"
              >
                {index < recipe.steps.length - 1 ? (
                  <span className="absolute left-[13px] top-[38px] h-[28px] border-l border-dashed border-[#c9bcae]" />
                ) : null}
                <span className="relative z-10 grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-[#8b9a7a] text-[12px] font-semibold text-[#fffaf2] shadow-[0_6px_12px_rgba(99,114,75,0.18)]">
                  {index + 1}
                </span>
                <StepThumb index={index} />
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
        <div className="recipe-action-bar pointer-events-auto grid h-[68px] grid-cols-[1fr_1fr_1.75fr_1fr] items-center rounded-[28px] px-2 text-[#8b7e72]">
          {bottomActions.slice(0, 2).map((action) => {
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
            className={`flex h-11 w-32 items-center justify-center gap-1.5 rounded-full text-[14px] font-semibold tracking-[0.03em] text-[#fffaf2] shadow-[0_12px_24px_rgba(91,105,64,0.22)] ${
              isFavorite ? "bg-[#6f7d55]" : "bg-[#8b9a7a]"
            } disabled:opacity-70`}
          >
            <Bookmark size={18} className={isFavorite ? "fill-[#fffaf2]/24" : ""} />
            {isFavoriteLoading ? "处理中" : isFavorite ? "已收藏" : "加入收藏"}
          </button>
          {bottomActions.slice(2).map((action) => {
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
        </div>
      </div>
    </AppViewport>
  );
}
