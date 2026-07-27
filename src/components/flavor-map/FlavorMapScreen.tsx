"use client";

import { motion } from "framer-motion";
import { Feather } from "lucide-react";
import { ChefTicket } from "@/components/flavor-map/ChefTicket";
import styles from "@/components/flavor-map/FlavorMap.module.css";
import { AppViewport } from "@/components/layout/AppViewport";
import { TabBar } from "@/components/layout/TabBar";
import { useChefCategories } from "@/hooks/useChefCategories";

export function FlavorMapScreen() {
  const { categories, error, isLoading } = useChefCategories();

  return (
    <AppViewport>
      <section
        className={`${styles.screen} app-content tab-page-content overflow-x-hidden px-5 pt-7`}
      >
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-20"
        >
          <h1 className="font-display text-[38px] leading-none tracking-[0.06em] text-[#3a2a1d]">
            风味地图
          </h1>
          <div className="mt-1 flex items-center gap-3 text-[#9c7a55]">
            <span className="font-script text-[25px] leading-none">
              Flavor Map
            </span>
            <span className="h-px w-10 bg-[#b89975]/55" />
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5 }}
          className="relative z-20 mt-8"
        >
          <p className="text-[20px] font-medium leading-[1.5] tracking-[0.045em] text-[#4b392b]">
            每一张票根
            <br />
            都是一类值得收藏的味道
          </p>
          <div className="mt-3 h-[2px] w-16 bg-gradient-to-r from-[#8a5a35]/80 via-[#c8a06d]/55 to-transparent" />
        </motion.div>

        <div
          className={`${styles.stack} ${styles.ticketStackInset} relative z-10 mt-12`}
        >
          {categories.length === 0 ? (
            <p
              className="py-12 text-center text-[12px] tracking-[0.08em] text-[#8f8173]"
              role="status"
            >
              {isLoading ? "正在取出你的收藏票根…" : error}
            </p>
          ) : null}

          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.16 + Math.min(index, 5) * 0.065,
                duration: 0.42,
              }}
              className={index > 0 ? "relative -mt-[18px]" : "relative"}
              style={{ zIndex: categories.length - index }}
            >
              <ChefTicket category={category} index={index} />
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 mt-7 flex items-center justify-center gap-2 pb-2 text-[12px] font-medium tracking-[0.04em] text-[#95887a]">
          <span className="h-px w-8 border-t border-dashed border-[#dec9b4]" />
          <span className="grid h-7 w-7 place-items-center rounded-full border border-[#b9aa9b]/50 bg-white/20">
            <Feather size={14} />
          </span>
          <span>向下翻阅全部分类</span>
          <span className="h-px w-8 border-t border-dashed border-[#dec9b4]" />
        </div>
      </section>

      <TabBar current="flavor-map" />
    </AppViewport>
  );
}
