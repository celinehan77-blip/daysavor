"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Feather, Plane } from "lucide-react";
import { ChefTicket } from "@/components/flavor-map/ChefTicket";
import styles from "@/components/flavor-map/FlavorMap.module.css";
import { AppViewport } from "@/components/layout/AppViewport";
import { TabBar } from "@/components/layout/TabBar";
import { useChefCategories } from "@/hooks/useChefCategories";
import {
  getPageRevealMotion,
  getSurfaceRevealMotion,
} from "@/lib/motion/pageReveal";

export function FlavorMapScreen() {
  const { categories, error, isLoading } = useChefCategories();
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <AppViewport>
      <section
        className={`${styles.screen} app-content tab-page-content overflow-x-hidden px-5 pt-7`}
      >
        <motion.header
          {...getPageRevealMotion(0, reducedMotion)}
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
            <span className={styles.airMailMark} aria-hidden="true">
              <span />
              <span />
              <span />
              <Plane size={13} strokeWidth={1.25} />
            </span>
          </div>

          <aside className={styles.travelTag} aria-hidden="true">
            <span className={styles.travelTagPin} />
            <Plane
              className={styles.travelTagPlane}
              size={12}
              strokeWidth={1.45}
            />
            <p className={styles.travelTagTitle}>探索美食世界</p>
            <p className={styles.travelTagSubtitle}>从这里出发</p>
            <span className={styles.travelTagRule} />
            <span className={styles.travelTagBarcode} />
          </aside>
        </motion.header>

        <motion.div
          {...getPageRevealMotion(1, reducedMotion)}
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
              {...getSurfaceRevealMotion(index + 2, reducedMotion)}
              className={`${styles.ticketReveal} ${index > 0 ? "relative -mt-[18px]" : "relative"}`}
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
