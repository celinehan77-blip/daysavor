"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Compass, Flame, Search, Star } from "lucide-react";
import { AppViewport } from "@/components/layout/AppViewport";
import { TabBar } from "@/components/layout/TabBar";
import { getCurrentUser } from "@/lib/auth/session";
import { getFavoriteRecipes } from "@/lib/data";
import {
  getPageRevealMotion,
  getSurfaceRevealMotion,
} from "@/lib/motion/pageReveal";
import type { Recipe } from "@/types";

export function FavoritesScreen() {
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const reducedMotion = Boolean(useReducedMotion());

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const [user, recipes] = await Promise.all([
            getCurrentUser(),
            getFavoriteRecipes(),
          ]);

          if (!active) return;

          setIsLoggedIn(Boolean(user));
          setFavoriteRecipes(recipes);
        } finally {
          if (active) setIsLoading(false);
        }
      })();
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <AppViewport>

      <div className="app-content tab-page-content px-5 pt-3">
        <motion.header
          {...getPageRevealMotion(0, reducedMotion)}
          className="pt-2"
        >
          <p className="text-[13px] font-semibold tracking-[0.22em] text-[#8a5a35]/75">
            Saved Recipes
          </p>
          <h1 className="font-display mt-1 text-[38px] leading-none tracking-[0.08em] text-[#3a2a1d]">
            我的收藏
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-[#75695f]">
            把想再次做的味道，留在这里
          </p>
          {isLoggedIn ? (
            <p className="mt-2 text-[12px] leading-5 text-[#8a5a35]">
              已登录，收藏将用于云端同步
            </p>
          ) : null}
        </motion.header>

        <Link
          href="/search"
          className="mt-5 flex h-12 items-center gap-3 rounded-[20px] border border-[#ded3c7]/70 bg-white/38 px-4 text-[14px] font-semibold text-[#8a6f58] shadow-[0_10px_24px_rgba(74,48,27,0.06)]"
        >
          <Search size={17} />
          搜索已收藏的菜谱
        </Link>

        {!isLoading && favoriteRecipes.length > 0 ? (
          <section className="mt-5 space-y-3">
            {favoriteRecipes.map((recipe, index) => (
              <motion.article
                key={recipe.slug}
                {...getSurfaceRevealMotion(index + 1, reducedMotion)}
                className="[backface-visibility:hidden] will-change-[transform,opacity]"
              >
                <Link
                  href={`/recipe/${recipe.slug}`}
                  className="paper-card block rounded-[24px] px-4 py-4"
                >
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold tracking-[0.2em] text-[#8a5a35]/72">
                          {recipe.titleEn}
                        </p>
                        <h2 className="font-display mt-1 text-[27px] leading-none tracking-[0.06em] text-[#3a2a1d]">
                          {recipe.titleZh}
                        </h2>
                      </div>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#fffaf2]/76 text-[#8a5a35] shadow-[0_10px_22px_rgba(78,52,29,0.08)]">
                        <Star size={18} className="fill-[#8a5a35]/16" />
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-[#6a5748]">
                      <span className="rounded-full bg-[#fffaf2]/62 px-2.5 py-1.5">
                        {recipe.timeMinutes} 分钟
                      </span>
                      <span className="rounded-full bg-[#fffaf2]/62 px-2.5 py-1.5">
                        {recipe.difficulty}
                      </span>
                      <span className="truncate rounded-full bg-[#fffaf2]/62 px-2.5 py-1.5">
                        {recipe.flavor}
                      </span>
                    </div>

                    <p className="mt-3 text-[13px] leading-5 text-[#75695f]">
                      {recipe.mainIngredient}
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-[#8a8178]">
                      {recipe.description}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-wrap gap-1.5">
                        {recipe.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[#8b9a7a]/12 px-2 py-1 text-[10px] font-medium text-[#6f7d55]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <ChevronRight size={18} className="shrink-0 text-[#8a8178]" />
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </section>
        ) : !isLoading ? (
          <motion.section
            {...getSurfaceRevealMotion(1, reducedMotion)}
            className="paper-card mt-9 rounded-[26px] px-5 py-7 text-center"
          >
            <div className="relative z-10">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#fffaf2]/78 text-[#8a5a35] shadow-[0_12px_28px_rgba(78,52,29,0.1)]">
                <Compass size={25} />
              </div>
              <h2 className="font-display mt-5 text-[24px] tracking-[0.06em] text-[#3a2a1d]">
                还没有收藏的菜谱
              </h2>
              <p className="mx-auto mt-2 max-w-[230px] text-[13px] leading-6 text-[#75695f]">
                去风味地图里，挑一张想留下的味道票根
              </p>
              <Link
                href="/flavor-map"
                className="mx-auto mt-5 flex h-11 w-[142px] items-center justify-center gap-1.5 rounded-full bg-[#8b9a7a] text-[14px] font-semibold text-[#fffaf2] shadow-[0_12px_24px_rgba(91,105,64,0.2)]"
              >
                <Flame size={16} />
                去风味地图
              </Link>
            </div>
          </motion.section>
        ) : null}

      </div>

      <TabBar current="favorites" />
    </AppViewport>
  );
}
