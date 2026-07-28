"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
  type PanInfo,
  type Transition,
} from "framer-motion";
import { flushSync } from "react-dom";
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
import {
  COVER_FLOW_CARD_STRIDE,
  getContinuousCoverFlowOffset,
  getCoverFlowTransform,
  getProjectedCardDelta,
  getSnapDurationMs,
} from "./chickenStationMotion";

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
      className="paper-card relative h-full overflow-hidden rounded-[28px] p-7 text-center"
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

function MotionRecipeCard({
  activeIndex,
  dragX,
  index,
  isActive,
  recipe,
  total,
}: {
  activeIndex: number;
  dragX: MotionValue<number>;
  index: number;
  isActive: boolean;
  recipe: SerializableRecipe;
  total: number;
}) {
  const offset = useTransform(dragX, (x) =>
    getContinuousCoverFlowOffset(
      index,
      activeIndex,
      -x / COVER_FLOW_CARD_STRIDE,
      total,
    ),
  );
  const transformState = useTransform(offset, getCoverFlowTransform);
  const x = useTransform(transformState, (state) => state.x);
  const y = useTransform(transformState, (state) => state.y);
  const z = useTransform(transformState, (state) => state.z);
  const rotateY = useTransform(transformState, (state) => state.rotateY);
  const scale = useTransform(transformState, (state) => state.scale);
  const opacity = useTransform(transformState, (state) => state.opacity);
  const zIndex = useTransform(transformState, (state) => state.zIndex);
  const filter = useTransform(
    transformState,
    ({ blur, brightness }) =>
      `blur(${blur.toFixed(2)}px) brightness(${brightness.toFixed(3)})`,
  );
  const boxShadow = useTransform(
    transformState,
    ({ shadowOpacity }) =>
      `0 26px 64px rgba(72, 49, 30, ${shadowOpacity.toFixed(3)})`,
  );

  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-0 -ml-[135px] h-[450px] w-[270px] text-left"
      style={{
        x,
        y,
        z,
        rotateY,
        scale,
        opacity,
        zIndex,
        filter,
        boxShadow,
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
        willChange: "transform, opacity, filter",
      }}
    >
      <RecipeCard recipe={recipe} isActive={isActive} />
    </motion.div>
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
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const dragX = useMotionValue(0);
  const reducedMotion = useReducedMotion();
  const animationRef = useRef<AnimationPlaybackControls | null>(null);
  const animationTokenRef = useRef(0);
  const didDragRef = useRef(false);
  const dragStartXRef = useRef(0);
  const safeActiveIndex = normalizeActiveIndex(activeIndex, recipes.length);
  const canSwitchRecipes = recipes.length > 1;

  useEffect(
    () => () => {
      animationRef.current?.stop();
    },
    [],
  );

  const settleBy = useCallback(
    (cardDelta: number, velocity = 0) => {
      animationRef.current?.stop();
      const token = ++animationTokenRef.current;
      const targetX = -cardDelta * COVER_FLOW_CARD_STRIDE;
      const duration = getSnapDurationMs(cardDelta, velocity) / 1_000;
      const transition = reducedMotion
        ? { duration: 0.12, ease: "easeOut" as const }
        : {
            type: "spring" as const,
            visualDuration: duration,
            bounce: 0.14,
          };

      const controls = animate(dragX, targetX, transition);
      animationRef.current = controls;

      void controls.then(() => {
        if (token !== animationTokenRef.current) {
          return;
        }

        if (cardDelta !== 0) {
          flushSync(() => {
            setActiveIndex((currentIndex) =>
              normalizeActiveIndex(
                currentIndex + cardDelta,
                recipes.length,
              ),
            );
          });
          dragX.set(0);
        }
      });
    },
    [dragX, recipes.length, reducedMotion],
  );

  const selectRecipe = useCallback(
    (nextIndex: number) => {
      if (!canSwitchRecipes) {
        return;
      }

      const cardDelta = getContinuousCoverFlowOffset(
        nextIndex,
        safeActiveIndex,
        0,
        recipes.length,
      );
      settleBy(Math.round(cardDelta));
    },
    [canSwitchRecipes, recipes.length, safeActiveIndex, settleBy],
  );

  const handleDragStart = useCallback(() => {
    didDragRef.current = true;
    animationRef.current?.stop();
    animationTokenRef.current += 1;
    dragStartXRef.current = dragX.get();
  }, [dragX]);

  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const eventTarget = event.currentTarget ?? event.target;
      if (eventTarget instanceof HTMLElement) {
        eventTarget.blur();
      }

      if (!canSwitchRecipes) {
        settleBy(0);
        return;
      }

      const velocity = info.velocity.x;
      const dragOffset = dragStartXRef.current + info.offset.x;
      const cardDelta = getProjectedCardDelta({
        dragOffset,
        velocity,
        totalCards: recipes.length,
      });
      settleBy(cardDelta, velocity);
    },
    [canSwitchRecipes, recipes.length, settleBy],
  );

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
  const recipeSummary = `${recipeCount} ${
    recipeCount === 1 ? "Recipe" : "Recipes"
  }`;

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
            <div
              className="relative mt-10 h-[466px]"
              style={{
                perspective: "1100px",
                perspectiveOrigin: "50% 44%",
                transformStyle: "preserve-3d",
              }}
            >
              {recipes.map((recipe, index) => {
                const isActive = index === safeActiveIndex;
                const offset = getContinuousCoverFlowOffset(
                  index,
                  safeActiveIndex,
                  0,
                  recipeCount,
                );

                return (
                  <Fragment key={recipe.id}>
                    <MotionRecipeCard
                      activeIndex={safeActiveIndex}
                      dragX={dragX}
                      index={index}
                      isActive={isActive}
                      recipe={recipe}
                      total={recipeCount}
                    />
                    {Math.abs(offset) === 1 ? (
                      <button
                        type="button"
                        aria-label={`切换到${recipe.titleZh}`}
                        onClick={() => selectRecipe(index)}
                        className={`absolute top-16 z-[120] h-[326px] w-[108px] cursor-pointer rounded-[28px] bg-black/[0.001] ${
                          offset < 0 ? "left-[-38px]" : "right-[-38px]"
                        }`}
                      />
                    ) : null}
                  </Fragment>
                );
              })}
              <motion.button
                type="button"
                aria-label={`打开${activeRecipe.titleZh}菜谱详情`}
                drag={canSwitchRecipes ? "x" : false}
                dragMomentum={false}
                onPointerDown={() => {
                  didDragRef.current = false;
                }}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  if (!didDragRef.current) {
                    router.push(`/recipe/${activeRecipe.slug}`);
                  }
                }}
                whileTap={reducedMotion ? undefined : { scale: 0.985 }}
                style={{
                  x: dragX,
                  touchAction: "pan-y",
                  willChange: "transform",
                }}
                className="absolute left-1/2 top-0 z-[110] -ml-[135px] h-[450px] w-[270px] cursor-grab rounded-[28px] bg-transparent active:cursor-grabbing"
              />
            </div>

            {canSwitchRecipes ? (
              <div className="relative z-50 mt-2 flex justify-center gap-3">
                {recipes.map((recipe, index) => (
                  <motion.button
                    key={`dot-${recipe.id}`}
                    type="button"
                    aria-label={`查看${recipe.titleZh}`}
                    onClick={() => selectRecipe(index)}
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
