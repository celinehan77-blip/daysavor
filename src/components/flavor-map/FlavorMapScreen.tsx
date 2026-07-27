"use client";

import { motion } from "framer-motion";
import { BriefcaseBusiness, Feather, Utensils } from "lucide-react";
import { StationTicket } from "@/components/flavor-map/StationTicket";
import { AppViewport } from "@/components/layout/AppViewport";
import { TabBar } from "@/components/layout/TabBar";
import type { SerializableStation } from "@/types";

type FlavorMapScreenProps = {
  stations: SerializableStation[];
};

export function FlavorMapScreen({ stations }: FlavorMapScreenProps) {
  return (
    <AppViewport>

      <section className="app-content tab-page-content overflow-hidden px-5 pt-6">
        <div className="relative z-10 flex items-start justify-between">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <h1 className="font-display whitespace-nowrap text-[38px] leading-none tracking-[0.06em] text-[#3a2a1d]">
              风味地图
            </h1>
            <div className="mt-1 flex items-center gap-3 text-[#c8a06d]/72">
              <span className="font-script text-[25px] leading-none">
                Flavor Map
              </span>
              <span className="h-px w-9 bg-[#c8a06d]/42" />
            </div>
          </motion.div>

          <div className="mt-1 flex h-10 items-center rounded-full border border-[#d9cdbc]/55 bg-[#f3ebdd]/48 p-1 text-[11px] font-semibold text-[#8a8178] shadow-[0_12px_28px_rgba(80,52,32,0.07)]">
            <span className="flex h-8 items-center gap-1 rounded-full bg-[#6f4a2e] px-2.5 text-[#faf6f0] shadow-[0_7px_16px_rgba(74,52,33,0.13)]">
              <Utensils size={14} />
              食材分类
            </span>
            <span className="flex h-8 items-center gap-1 px-2.5">
              <BriefcaseBusiness size={14} />
              烹饪方式
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.55 }}
          className="relative z-10 mt-7"
        >
          <p className="text-[21px] font-medium leading-[1.48] tracking-[0.04em] text-[#4b392b]">
            每一张票根
            <br />
            都是一道值得收藏的菜
          </p>
          <div className="mt-3 h-[3px] w-15 rounded-full bg-gradient-to-r from-[#8a5a35] via-[#c8a06d]/70 to-transparent" />
        </motion.div>

        <div className="relative z-10 mt-20">
          {stations.map((station, index) => (
            <motion.div
              key={station.id}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + index * 0.12, duration: 0.55 }}
              className={index > 0 ? "-mt-[18px]" : ""}
            >
              <StationTicket
                station={station}
                stationNo={String(index + 1).padStart(2, "0")}
                isPrimary={index === 0}
              />
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 mt-5 flex items-center justify-center gap-2 text-[13px] font-medium text-[#95887a]">
          <span className="h-px w-8 border-t border-dashed border-[#dec9b4]" />
          <span className="grid h-7 w-7 place-items-center rounded-full border border-[#b9aa9b]/60 bg-white/28">
            <Feather size={15} />
          </span>
          <span>滑动探索更多站点</span>
          <span className="h-px w-8 border-t border-dashed border-[#dec9b4]" />
        </div>
      </section>

      <TabBar current="flavor-map" />
    </AppViewport>
  );
}
