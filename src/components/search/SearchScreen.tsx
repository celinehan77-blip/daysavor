"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Search, Sparkles } from "lucide-react";
import { AppViewport } from "@/components/layout/AppViewport";
import { TabBar } from "@/components/layout/TabBar";
import { searchRecipes } from "@/lib/searchRecipes";
import type { SerializableRecipe, SerializableStation } from "@/types";

const suggestedKeywords = ["鸡肉", "川味", "简单"];

type SearchScreenProps = {
  recipes: SerializableRecipe[];
  stations: SerializableStation[];
};

export function SearchScreen({ recipes, stations }: SearchScreenProps) {
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();

  const results = useMemo(
    () => searchRecipes(query, recipes, stations),
    [query, recipes, stations],
  );

  return (
    <AppViewport>

      <div className="app-content tab-page-content px-5 pt-3">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="pt-2"
        >
          <p className="text-[13px] font-semibold tracking-[0.22em] text-[#8a5a35]/75">
            Search Recipes
          </p>
          <h1 className="font-display mt-1 text-[38px] leading-none tracking-[0.08em] text-[#3a2a1d]">
            搜索菜谱
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-[#75695f]">
            从你的味道收藏里，找到想做的那一道。
          </p>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45 }}
          className="glass-panel mt-6 rounded-[24px] p-3"
        >
          <div className="flex h-[58px] items-center gap-3 rounded-[20px] border border-[#ded3c7]/70 bg-white/42 px-4 text-[#8a8178] shadow-inner">
            <Search size={20} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="搜索菜名、食材或口味"
              placeholder="搜索菜名、食材或口味"
              className="min-w-0 flex-1 bg-transparent text-[16px] font-medium text-[#5f5043] outline-none placeholder:text-[#b4aaa1]"
            />
          </div>
        </motion.section>

        {!trimmedQuery ? (
          <section className="paper-card mt-7 rounded-[26px] px-5 py-6 text-center">
            <div className="relative z-10">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#fffaf2]/78 text-[#8a5a35] shadow-[0_12px_28px_rgba(78,52,29,0.1)]">
                <Sparkles size={22} />
              </div>
              <p className="mt-4 text-[14px] leading-6 text-[#75695f]">
                试试搜索：鸡肉、川味、25 分钟
              </p>
              <div className="mt-4 flex justify-center gap-2">
                {suggestedKeywords.map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => setQuery(keyword)}
                    className="rounded-full bg-[#8b9a7a]/12 px-3 py-1.5 text-[12px] font-semibold text-[#6f7d55]"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : results.length > 0 ? (
          <section className="mt-6 space-y-3">
            {results.map((recipe, index) => (
              <motion.article
                key={recipe.slug}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.38 }}
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
                      <ChevronRight size={19} className="mt-2 shrink-0 text-[#8a8178]" />
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

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {recipe.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#8b9a7a]/12 px-2 py-1 text-[10px] font-medium text-[#6f7d55]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </section>
        ) : (
          <section className="paper-card mt-7 rounded-[26px] px-5 py-7 text-center">
            <div className="relative z-10">
              <h2 className="font-display text-[24px] tracking-[0.06em] text-[#3a2a1d]">
                没有找到相关菜谱
              </h2>
              <p className="mx-auto mt-2 max-w-[230px] text-[13px] leading-6 text-[#75695f]">
                换个菜名、食材或口味试试
              </p>
            </div>
          </section>
        )}
      </div>

      <TabBar current="home" />
    </AppViewport>
  );
}
