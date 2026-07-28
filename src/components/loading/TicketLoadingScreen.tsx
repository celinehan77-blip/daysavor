"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, CookingPot, Leaf, Plus, Star } from "lucide-react";
import { AppViewport } from "@/components/layout/AppViewport";
import {
  getLatestGeneratedRecipeSlug,
  getLatestParsedDraft,
} from "@/lib/data";
import {
  clearPendingRecipeGeneration,
  getPendingRecipeGeneration,
  resumePendingRecipeGeneration,
} from "@/lib/data/pendingRecipeGeneration";
import { loadingSteps } from "@/lib/mockData";

const ticketMotion = {
  y: [0, -4, 0],
};

export function TicketLoadingScreen() {
  const router = useRouter();
  const [recipeTitle, setRecipeTitle] = useState("你的菜谱");
  const [recipeTitleEn, setRecipeTitleEn] = useState("Your Recipe");
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let active = true;
    let navigationTimer: number | null = null;
    const updateTitle = () => {
      const draft = getLatestParsedDraft();
      if (draft) {
        setRecipeTitle(draft.titleZh);
        setRecipeTitleEn(draft.titleEn || "Your Recipe");
      }
    };
    const titleTimer = window.setTimeout(updateTitle, 0);
    const pending = getPendingRecipeGeneration();
    const progressTimers = [1800, 5000, 9000, 13000].map((delay, index) =>
      window.setTimeout(() => {
        if (active) {
          setCurrentStep((current) => Math.max(current, index + 1));
        }
      }, delay),
    );

    if (pending) {
      void resumePendingRecipeGeneration(pending).then((result) => {
        if (!active) return;

        updateTitle();
        if (result.ok) {
          setCurrentStep(loadingSteps.length - 1);
          navigationTimer = window.setTimeout(() => {
            clearPendingRecipeGeneration();
            router.push(`/recipe/${result.slug}`);
          }, 700);
        } else {
          navigationTimer = window.setTimeout(() => {
            clearPendingRecipeGeneration();
            router.push("/");
          }, 700);
        }
      });
    } else {
      navigationTimer = window.setTimeout(() => {
        void getLatestGeneratedRecipeSlug().then((recipeSlug) => {
          router.push(`/recipe/${recipeSlug || "kung-pao-chicken"}`);
        });
      }, 3000);
    }

    return () => {
      active = false;
      window.clearTimeout(titleTimer);
      if (navigationTimer !== null) {
        window.clearTimeout(navigationTimer);
      }
      progressTimers.forEach((progressTimer) => window.clearTimeout(progressTimer));
    };
  }, [router]);

  return (
    <AppViewport>

      <section className="app-content overflow-hidden px-7 pb-8 pt-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.58 }}
          className="pt-1"
        >
          <h1 className="font-display text-[30px] leading-tight tracking-[0.06em] text-[#3a2a1d]">
            正在制作收藏票根
          </h1>
          <p className="mt-3 text-[15px] tracking-[0.045em] text-[#8a8178]">
            请稍候，美味即将抵达你的收藏夹
          </p>
        </motion.div>

        <div className="relative mx-auto mt-8 h-[492px] w-[326px] max-w-full">
          <motion.div
            initial={{ opacity: 0, y: 24, rotate: -0.7 }}
            animate={{ opacity: 1, rotate: -0.7, ...ticketMotion }}
            transition={{
              opacity: { delay: 0.08, duration: 0.45 },
              y: {
                delay: 0.24,
                duration: 4.2,
                ease: "easeInOut",
                repeat: Infinity,
              },
            }}
            className="loading-ticket loading-ticket-main absolute left-0 top-0 z-40 h-[202px] w-full px-7 pb-6 pt-6 text-left"
          >
            <span className="ticket-perforation ticket-perforation-left" />
            <span className="ticket-perforation ticket-perforation-right" />
            <div className="relative z-10 flex justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6f5a45]">
              <span>FLAVOR TICKET</span>
              <span>No.20240520</span>
            </div>
            <h2 className="font-display relative z-10 mt-6 text-center text-[30px] leading-none tracking-[0.12em] text-[#352417]">
              {recipeTitle}
            </h2>
            <p className="relative z-10 mt-2 text-center font-serif text-[16px] text-[#49392b]">
              {recipeTitleEn}
            </p>
            <div className="relative z-10 mt-5 flex items-end justify-between border-t border-dashed border-[#7e6044]/18 pt-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#7e6958]">
                  FROM
                </p>
                <p className="font-display mt-1 text-[16px] text-[#3d2d20]">
                  菜谱正文
                </p>
              </div>
              <div className="mb-2 flex items-center gap-2 text-[#b09a80]">
                <span className="h-px w-10 bg-[#b09a80]/45" />
                <Plus size={23} strokeWidth={1.7} />
                <span className="h-px w-10 bg-[#b09a80]/45" />
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#7e6958]">
                  TO
                </p>
                <p className="font-display mt-1 text-[16px] text-[#3d2d20]">
                  你的收藏夹
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 26, rotate: 1.1 }}
            animate={{ opacity: 1, rotate: 1.1, y: [0, -3, 0] }}
            transition={{
              opacity: { delay: 0.28, duration: 0.45 },
              y: {
                delay: 0.62,
                duration: 4.6,
                ease: "easeInOut",
                repeat: Infinity,
              },
            }}
            className="loading-ticket loading-ticket-layer absolute left-2 top-[178px] z-30 h-[124px] w-[312px] px-7 py-7 text-left"
          >
            <span className="ticket-perforation ticket-perforation-left" />
            <span className="ticket-perforation ticket-perforation-right" />
            <div className="relative z-10 max-w-[172px]">
              <p className="font-display text-[19px] leading-snug tracking-[0.08em] text-[#3b2b1f]">
                食材识别完成
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6d5f54]">
                INGREDIENTS VERIFIED
              </p>
            </div>
            <div className="ticket-stamp stamp-sage absolute right-6 top-5 rotate-[-12deg]">
              <span className="stamp-arc">INGREDIENTS</span>
              <Leaf size={27} strokeWidth={1.8} />
              <span className="stamp-bottom">VERIFIED</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28, rotate: -1.2 }}
            animate={{ opacity: 1, rotate: -1.2, y: [0, 3, 0] }}
            transition={{
              opacity: { delay: 0.48, duration: 0.45 },
              y: {
                delay: 0.9,
                duration: 4.9,
                ease: "easeInOut",
                repeat: Infinity,
              },
            }}
            className="loading-ticket loading-ticket-layer loading-ticket-layer-soft absolute left-1 top-[276px] z-20 h-[124px] w-[318px] px-7 py-7 text-left"
          >
            <span className="ticket-perforation ticket-perforation-left" />
            <span className="ticket-perforation ticket-perforation-right" />
            <div className="relative z-10 max-w-[172px]">
              <p className="font-display text-[19px] leading-snug tracking-[0.08em] text-[#3b2b1f]">
                步骤整理完成
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d5f54]">
                RECIPE CREATED
              </p>
            </div>
            <div className="ticket-stamp stamp-caramel absolute right-7 top-6 rotate-[8deg]">
              <span className="stamp-arc">RECIPE</span>
              <CookingPot size={27} strokeWidth={1.8} />
              <span className="stamp-bottom">CREATED</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30, rotate: 0.8 }}
            animate={{ opacity: 1, rotate: 0.8, y: [0, -2, 0] }}
            transition={{
              opacity: { delay: 0.68, duration: 0.45 },
              y: {
                delay: 1.12,
                duration: 5.1,
                ease: "easeInOut",
                repeat: Infinity,
              },
            }}
            className="loading-ticket loading-ticket-layer loading-ticket-layer-light absolute left-3 top-[374px] z-10 h-[124px] w-[306px] px-7 py-7 text-left"
          >
            <span className="ticket-perforation ticket-perforation-left" />
            <span className="ticket-perforation ticket-perforation-right" />
            <div className="relative z-10 max-w-[164px]">
              <p className="font-display text-[19px] leading-snug tracking-[0.08em] text-[#3b2b1f]">
                票根制作完成
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6d5f54]">
                TICKET READY
              </p>
            </div>
            <div className="ticket-stamp stamp-terracotta absolute right-6 top-5 rotate-[-7deg]">
              <span className="stamp-arc">READY TO</span>
              <Star size={27} strokeWidth={1.8} />
              <span className="stamp-bottom">COLLECT</span>
            </div>
          </motion.div>
        </div>

        <div className="mx-auto mt-0 w-[252px] text-left">
          {loadingSteps.map((step, index) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + index * 0.2, duration: 0.35 }}
              className="relative flex items-center gap-4 py-1.5 text-[14px]"
            >
              {index < loadingSteps.length - 1 ? (
                <span className="absolute left-[10px] top-7 h-6 w-px bg-[#d8cbbb]" />
              ) : null}
              <span
                className={`relative z-10 grid h-5 w-5 place-items-center rounded-full ${
                  index < currentStep
                    ? "bg-[#8b9a7a] text-white"
                    : index === currentStep
                      ? "bg-[#c4a06f] text-white"
                      : "border border-[#d7cabb] bg-[#fbf8f3] text-[#d0bfae]"
                }`}
              >
                {index < currentStep ? (
                  <Check size={13} />
                ) : index === currentStep ? (
                  <span className="h-2 w-2 rounded-full bg-white/88" />
                ) : null}
              </span>
              <span
                className={
                  index <= currentStep
                    ? "font-medium text-[#5b4737]"
                    : "text-[#aa9d91]"
                }
              >
                {step.label}
              </span>
            </motion.div>
          ))}
        </div>
      </section>
    </AppViewport>
  );
}
