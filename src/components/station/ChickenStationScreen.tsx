"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { motion, type PanInfo, type Transition } from "framer-motion";
import {
  BarChart3,
  Bookmark,
  ChevronLeft,
  Clock3,
  MoreHorizontal,
  Soup,
  Tags,
} from "lucide-react";
import { AppViewport } from "@/components/layout/AppViewport";
import type { SerializableRecipe, SerializableStation } from "@/types";

const ingredientLabelPositions = [
  { left: "13%", top: "31%" },
  { left: "70%", top: "36%" },
  { left: "12%", top: "65%" },
  { left: "70%", top: "68%" },
  { left: "43%", top: "78%" },
];

const cardTransition: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 28,
  mass: 0.8,
};

function getCoverFlowOffset(index: number, activeIndex: number, total: number) {
  let offset = index - activeIndex;

  if (offset > total / 2) {
    offset -= total;
  }

  if (offset < -total / 2) {
    offset += total;
  }

  return offset;
}

function getCardMotionState(offset: number) {
  const distance = Math.abs(offset);
  const direction = Math.sign(offset);

  if (distance === 0) {
    return {
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
      opacity: 1,
      zIndex: 30,
      filter: "blur(0px)",
    };
  }

  if (distance === 1) {
    return {
      x: direction * 166,
      y: 42,
      rotate: direction * 5,
      scale: 0.86,
      opacity: 0.58,
      zIndex: 20,
      filter: "blur(0.4px)",
    };
  }

  return {
    x: direction * 220,
    y: 66,
    rotate: direction * 7,
    scale: 0.72,
    opacity: 0.32,
    zIndex: 10,
    filter: "blur(0.8px)",
  };
}

function StationFoodMap({
  compact = false,
  recipe,
}: {
  compact?: boolean;
  recipe: SerializableRecipe;
}) {
  const sizeClass = compact ? "h-[190px]" : "h-[252px]";
  const ingredientLabels = [...recipe.ingredients, ...recipe.seasonings].slice(
    0,
    5,
  );

  return (
    <div className={`relative mx-auto mt-6 w-full ${sizeClass}`}>
      <div className="absolute left-1/2 top-1/2 h-24 w-28 -translate-x-1/2 -translate-y-1/2 rounded-[40px] bg-[#efb195] shadow-[inset_0_-8px_18px_rgba(177,94,67,0.18)]" />
      {[
        ["44%", "45%", "12deg"],
        ["53%", "47%", "-9deg"],
        ["48%", "56%", "4deg"],
      ].map(([left, top, rotate], index) => (
        <span
          key={`station-chicken-${index}`}
          className="absolute h-12 w-14 rounded-[22px] bg-[#f2bea7] shadow-[inset_0_-7px_12px_rgba(177,94,67,0.16)]"
          style={{ left, top, transform: `rotate(${rotate})` }}
        />
      ))}

      {[
        ["31%", "23%", "-22deg"],
        ["40%", "18%", "20deg"],
        ["25%", "44%", "18deg"],
        ["37%", "52%", "-30deg"],
      ].map(([left, top, rotate], index) => (
        <span
          key={`station-chili-${index}`}
          className="absolute h-4 w-16 rounded-full bg-gradient-to-r from-[#8f1f16] via-[#c93526] to-[#8f1f16]"
          style={{ left, top, transform: `rotate(${rotate})` }}
        />
      ))}

      {[
        ["58%", "23%"],
        ["66%", "26%"],
        ["72%", "31%"],
        ["63%", "38%"],
        ["76%", "42%"],
        ["56%", "34%"],
        ["66%", "48%"],
      ].map(([left, top], index) => (
        <span
          key={`station-peanut-${index}`}
          className="absolute h-4 w-6 rotate-[-18deg] rounded-full bg-[#c98c4f]"
          style={{ left, top }}
        />
      ))}

      {[
        ["58%", "59%"],
        ["62%", "66%"],
        ["70%", "62%"],
        ["75%", "70%"],
        ["66%", "75%"],
        ["81%", "63%"],
      ].map(([left, top], index) => (
        <span
          key={`station-pepper-${index}`}
          className="absolute h-2.5 w-2.5 rounded-full bg-[#65422d]"
          style={{ left, top }}
        />
      ))}

      <span className="absolute bottom-8 left-[45%] h-3 w-[72px] rotate-[52deg] rounded-full bg-[#85a765]" />
      <span className="absolute bottom-6 left-[48%] h-3 w-20 rotate-[48deg] rounded-full bg-[#6f9651]" />

      {!compact
        ? ingredientLabels.map((item, index) => (
            <div
              key={item.name}
              className="absolute text-[13px] leading-5 text-[#5f5043]"
              style={ingredientLabelPositions[index]}
            >
              <p className="font-semibold">{item.name}</p>
              <p className="text-[11px] text-[#9b8d80]">{item.note}</p>
            </div>
          ))
        : null}
    </div>
  );
}

function RecipeCard({
  recipe,
  isActive,
}: {
  recipe: SerializableRecipe;
  isActive: boolean;
}) {
  return (
    <article
      className={`paper-card relative h-full overflow-hidden rounded-[28px] p-7 text-center transition ${
        isActive ? "shadow-[0_26px_70px_rgba(72,49,30,0.22)]" : ""
      }`}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <span className="text-[12px] uppercase tracking-[0.22em] text-[#aa8060]">
            {recipe.titleEn}
          </span>
          <Bookmark className="fill-[#b47b42]/18 text-[#a86f38]" size={22} />
        </div>
        <h2 className="font-display mt-6 text-[39px] leading-none tracking-[0.12em] text-[#3a2a1d]">
          {recipe.titleZh}
        </h2>
        <p className="mt-3 text-[15px] leading-6 text-[#8a6f58]">
          {recipe.tags.join(" · ")}
        </p>
        <div className="mx-auto mt-4 h-1 w-11 rounded-full bg-[#c4a07e]" />

        <StationFoodMap recipe={recipe} compact={!isActive} />

        <div className="mt-6 grid grid-cols-3 divide-x divide-[#d8c9b8] text-[#4a3a2f]">
          <div className="flex items-center justify-center gap-2">
            <Clock3 size={19} />
            <span>{recipe.timeMinutes} 分钟</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <BarChart3 size={19} />
            <span>{recipe.difficulty}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Tags size={19} />
            <span>{recipe.flavor}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

type ChickenStationScreenProps = {
  station: SerializableStation | null;
  recipes: SerializableRecipe[];
};

function getStationTitle(station: SerializableStation) {
  return station.nameEn;
}

function normalizeActiveIndex(index: number, total: number) {
  if (total <= 0) return 0;

  return (index + total) % total;
}

export function ChickenStationScreen({
  recipes,
  station,
}: ChickenStationScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeActiveIndex = normalizeActiveIndex(activeIndex, recipes.length);
  const setSafeActiveIndex = (nextIndex: number) => {
    setActiveIndex(normalizeActiveIndex(nextIndex, recipes.length));
  };

  if (!station) {
    return (
      <AppViewport>
        <section className="app-content flex flex-col px-6 pb-8 pt-5">
          <Link
            href="/flavor-map"
            className="grid h-12 w-12 place-items-center rounded-full bg-white/52 text-[#7b634e] shadow-[0_16px_40px_rgba(82,55,34,0.1)]"
          >
            <ChevronLeft size={26} />
          </Link>
          <div className="paper-card mt-16 rounded-[28px] px-6 py-8 text-center">
            <div className="relative z-10">
              <h1 className="font-display text-[30px] tracking-[0.06em] text-[#3a2a1d]">
                没有找到这个驿站
              </h1>
              <p className="mt-3 text-[14px] leading-6 text-[#75695f]">
                回到风味地图，重新挑选一张味道票根
              </p>
              <Link
                href="/flavor-map"
                className="mx-auto mt-6 flex h-11 w-[142px] items-center justify-center rounded-full bg-[#8b9a7a] text-[14px] font-semibold text-[#fffaf2]"
              >
                返回风味地图
              </Link>
            </div>
          </div>
        </section>
      </AppViewport>
    );
  }

  const stationTitle = getStationTitle(station);
  const recipeCount = recipes.length;
  const activeRecipe = recipes[safeActiveIndex] ?? recipes[0];
  const hasRecipes = recipeCount > 0;
  const canSwitchRecipes = recipeCount > 1;
  const recipeSummary = `${recipeCount} ${
    recipeCount === 1 ? "Recipe" : "Recipes"
  }`;

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!canSwitchRecipes) return;

    if (info.offset.x < -42) {
      setSafeActiveIndex(safeActiveIndex + 1);
    }

    if (info.offset.x > 42) {
      setSafeActiveIndex(safeActiveIndex - 1);
    }
  };

  return (
    <AppViewport>

      <section className="app-content flex flex-col px-6 pb-8 pt-5">
        <div className="flex items-center justify-between">
          <Link
            href="/flavor-map"
            aria-label="返回风味地图"
            className="grid h-12 w-12 place-items-center rounded-full bg-white/52 text-[#7b634e] shadow-[0_16px_40px_rgba(82,55,34,0.1)]"
          >
            <ChevronLeft size={26} />
          </Link>
          <div className="text-left">
            <h1 className="font-display text-[34px] leading-none text-[#3a2a1d]">
              {stationTitle}
            </h1>
            <p className="mt-3 text-[18px] font-medium text-[#9a7655]">
              {hasRecipes ? recipeSummary : "No Recipes"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              aria-label="收藏驿站"
              className="grid h-12 w-12 place-items-center rounded-full bg-white/45 text-[#7b634e]"
            >
              <Bookmark size={20} />
            </button>
            <button
              aria-label="更多"
              className="grid h-12 w-12 place-items-center rounded-full bg-white/45 text-[#7b634e]"
            >
              <MoreHorizontal size={22} />
            </button>
          </div>
        </div>

        {!hasRecipes ? (
          <div className="paper-card mt-16 rounded-[28px] px-6 py-8 text-center">
            <div className="relative z-10">
              <h2 className="font-display text-[28px] tracking-[0.06em] text-[#3a2a1d]">
                这个驿站还没有菜谱
              </h2>
              <p className="mx-auto mt-3 max-w-[240px] text-[14px] leading-6 text-[#75695f]">
                以后收藏或生成相关菜谱后，会出现在这里
              </p>
              <Link
                href="/flavor-map"
                className="mx-auto mt-6 flex h-11 w-[142px] items-center justify-center rounded-full bg-[#8b9a7a] text-[14px] font-semibold text-[#fffaf2]"
              >
                回到风味地图
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="relative mt-10 h-[466px]">
              {recipes.map((recipe, index) => {
                const isActive = index === safeActiveIndex;
                const offset = getCoverFlowOffset(
                  index,
                  safeActiveIndex,
                  recipeCount,
                );
                const cardMotionState = getCardMotionState(offset);
                const cardBaseClass =
                  "absolute left-1/2 top-0 -ml-[135px] h-[450px] w-[270px]";
                const cardMotion = {
                  initial: false,
                  animate: cardMotionState,
                  transition: cardTransition,
                  style: { zIndex: cardMotionState.zIndex },
                };

                if (isActive) {
                  return (
                    <Link
                      key={recipe.id}
                      href={`/recipe/${recipe.slug}`}
                      aria-label={`打开${recipe.titleZh}菜谱详情`}
                      className={cardBaseClass}
                      style={{ zIndex: cardMotionState.zIndex }}
                    >
                      <motion.div
                        {...cardMotion}
                        drag={canSwitchRecipes ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.18}
                        onDragEnd={handleDragEnd}
                        whileTap={{ scale: 0.98 }}
                        className="h-full w-full cursor-pointer"
                      >
                        <RecipeCard recipe={recipe} isActive />
                      </motion.div>
                    </Link>
                  );
                }

                return (
                  <Fragment key={recipe.id}>
                    <motion.div
                      {...cardMotion}
                      className={`${cardBaseClass} pointer-events-none text-left`}
                    >
                      <RecipeCard recipe={recipe} isActive={false} />
                    </motion.div>
                    {Math.abs(offset) === 1 ? (
                      <button
                        type="button"
                        aria-label={`切换到${recipe.titleZh}`}
                        onMouseDown={() => setSafeActiveIndex(index)}
                        onPointerDown={() => setSafeActiveIndex(index)}
                        onClick={() => setSafeActiveIndex(index)}
                        onPointerUp={() => setSafeActiveIndex(index)}
                        className={`absolute top-16 z-40 h-[326px] w-[108px] cursor-pointer rounded-[28px] bg-black/[0.001] ${
                          offset < 0 ? "left-[-38px]" : "right-[-38px]"
                        }`}
                      />
                    ) : null}
                  </Fragment>
                );
              })}
            </div>

            {canSwitchRecipes ? (
              <div className="relative z-50 mt-2 flex justify-center gap-3">
                {recipes.map((recipe, index) => (
                  <motion.button
                    key={`dot-${recipe.id}`}
                    type="button"
                    aria-label={`查看${recipe.titleZh}`}
                    onClick={() => setSafeActiveIndex(index)}
                    animate={{
                      scale: index === safeActiveIndex ? 1 : 0.94,
                    }}
                    transition={cardTransition}
                    className={`h-2.5 rounded-full transition ${
                      index === safeActiveIndex
                        ? "w-6 bg-[#c28d58]"
                        : "w-2.5 bg-[#ddd3c8]"
                    }`}
                  />
                ))}
              </div>
            ) : (
              <div className="relative z-50 mt-2 h-2.5" />
            )}

            <motion.div
              key={activeRecipe?.id ?? "empty-recipe"}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="glass-panel relative z-50 mt-5 grid min-h-[100px] grid-cols-3 divide-x divide-[#ded2c5]/80 rounded-[26px] px-4 py-4"
            >
              <div className="flex items-center gap-3">
                <Clock3 className="text-[#8a8178]" size={26} />
                <div>
                  <p className="text-[12px] text-[#8a8178]">烹饪时间</p>
                  <p className="mt-2 text-[21px] font-semibold text-[#6f7d55]">
                    {activeRecipe?.timeMinutes ?? 0} 分钟
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 px-3">
                <BarChart3 className="text-[#8a8178]" size={26} />
                <div>
                  <p className="text-[12px] text-[#8a8178]">难度等级</p>
                  <p className="mt-2 text-[21px] font-semibold text-[#6f7d55]">
                    {activeRecipe?.difficulty ?? "暂无"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 pl-4">
                <Soup className="text-[#8a8178]" size={26} />
                <div>
                  <p className="text-[12px] text-[#8a8178]">主要食材</p>
                  <p className="mt-2 text-[15px] font-semibold leading-6 text-[#4a3a2f]">
                    {activeRecipe?.mainIngredient ?? "暂无"}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </section>
    </AppViewport>
  );
}
