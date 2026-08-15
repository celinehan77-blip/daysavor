"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  CookingPot,
  Leaf,
  LoaderCircle,
  Plus,
  Sparkles,
  Star,
} from "lucide-react";
import { AppViewport } from "@/components/layout/AppViewport";
import styles from "@/components/loading/TicketLoadingScreen.module.css";
import { getLatestGeneratedRecipeSlug } from "@/lib/data";
import {
  clearPendingRecipeGeneration,
  getPendingRecipeGeneration,
  resumePendingRecipeGeneration,
} from "@/lib/data/pendingRecipeGeneration";
import { loadingSteps } from "@/lib/mockData";

const ticketLayers = [
  {
    id: "recipe",
    variant: "recipe",
    className: styles.layerOne,
    icon: Leaf,
    offsetX: 6,
    rotation: 1,
    stampClassName: styles.stampSage,
    stampLabel: "INGREDIENTS VERIFIED",
    stampTop: "INGREDIENTS",
    stampBottom: "VERIFIED",
  },
  {
    id: "ingredients",
    variant: "status",
    className: styles.layerTwo,
    icon: Leaf,
    offsetX: -7,
    rotation: -1.2,
    stampClassName: styles.stampSage,
    stampLabel: "INGREDIENTS VERIFIED",
    stampTop: "INGREDIENTS",
    stampBottom: "VERIFIED",
    titleZh: "食材识别完成",
    titleEn: "INGREDIENTS VERIFIED",
  },
  {
    id: "steps",
    variant: "status",
    className: styles.layerThree,
    icon: CookingPot,
    offsetX: 5,
    rotation: 0.8,
    stampClassName: styles.stampCaramel,
    stampLabel: "RECIPE CREATED",
    stampTop: "RECIPE",
    stampBottom: "CREATED",
    titleZh: "步骤整理完成",
    titleEn: "RECIPE CREATED",
  },
  {
    id: "ticket",
    variant: "status",
    className: styles.layerFour,
    icon: Star,
    offsetX: -4,
    rotation: -0.6,
    stampClassName: styles.stampTerracotta,
    stampLabel: "TICKET READY TO COLLECT",
    stampTop: "READY TO",
    stampBottom: "COLLECT",
    titleZh: "票根制作完成",
    titleEn: "TICKET READY",
  },
] as const;

export function TicketLoadingScreen() {
  const router = useRouter();
  const reducedMotion = Boolean(useReducedMotion());
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let active = true;
    let navigationTimer: number | null = null;
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
      if (navigationTimer !== null) {
        window.clearTimeout(navigationTimer);
      }
      progressTimers.forEach((progressTimer) =>
        window.clearTimeout(progressTimer),
      );
    };
  }, [router]);

  return (
    <AppViewport>
      <section className={`${styles.screen} app-content`}>
        <motion.header
          initial={reducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0.01 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={styles.header}
        >
          <h1 className={styles.title}>正在制作收藏票根</h1>
          <p className={styles.subtitle}>请稍候，美味即将抵达你的收藏夹</p>
        </motion.header>

        <div className={styles.ticketStack} aria-label="收藏票根制作状态">
          {ticketLayers.map((ticket, index) => {
            const StampIcon = ticket.icon;

            return (
              <motion.article
                key={ticket.id}
                initial={
                  reducedMotion
                    ? false
                    : { opacity: 0, rotate: 0, x: 0, y: 12 }
                }
                animate={{
                  opacity: 1,
                  rotate: ticket.rotation,
                  x: ticket.offsetX,
                  y: 0,
                }}
                transition={{
                  delay: reducedMotion ? 0 : (ticketLayers.length - 1 - index) * 0.08,
                  duration: reducedMotion ? 0.01 : 0.46,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`${styles.ticketLayer} ${ticket.className}`}
              >
                <div className={styles.ticket}>
                  <span className={`${styles.edgeDots} ${styles.edgeDotsLeft}`} />
                  <span className={`${styles.edgeDots} ${styles.edgeDotsRight}`} />

                  <div className={styles.ticketHeader}>
                    <span>FLAVOR TICKET</span>
                    <span>NO.20240520</span>
                  </div>

                  {ticket.variant === "recipe" ? (
                    <>
                      <div className={styles.ticketTitleBlock}>
                        <h2>你的菜谱</h2>
                        <p>Your Recipe</p>
                      </div>

                      <div className={styles.ticketRule} aria-hidden="true">
                        <span />
                        <Leaf size={10} strokeWidth={1.45} />
                        <span />
                      </div>

                      <div className={styles.ticketFooter}>
                        <div>
                          <span className={styles.metaLabel}>FROM</span>
                          <strong>菜谱正文</strong>
                        </div>
                        <Plus
                          className={styles.ticketPlus}
                          size={18}
                          strokeWidth={1.45}
                        />
                        <div className={styles.destination}>
                          <span className={styles.metaLabel}>TO</span>
                          <strong>你的收藏夹</strong>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={styles.statusContent}>
                      <h2 className={styles.statusTitle}>{ticket.titleZh}</h2>
                      <p className={styles.statusEnglish}>{ticket.titleEn}</p>
                    </div>
                  )}

                  <div
                    className={`${styles.stamp} ${ticket.stampClassName}`}
                    aria-label={ticket.stampLabel}
                  >
                    <span>{ticket.stampTop}</span>
                    <StampIcon size={20} strokeWidth={1.65} />
                    <span>{ticket.stampBottom}</span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className={styles.progressList} aria-label="菜谱生成进度">
          {loadingSteps.map((step, index) => {
            const isComplete = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <motion.div
                key={step.label}
                initial={reducedMotion ? false : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: reducedMotion ? 0 : 0.32 + index * 0.07,
                  duration: reducedMotion ? 0.01 : 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={styles.progressItem}
              >
                {index < loadingSteps.length - 1 ? (
                  <span className={styles.progressLine} aria-hidden="true" />
                ) : null}
                <span
                  className={`${styles.progressDot} ${
                    isComplete
                      ? styles.progressComplete
                      : isCurrent
                        ? styles.progressCurrent
                        : styles.progressPending
                  }`}
                >
                  {isComplete ? <Check size={13} strokeWidth={2.2} /> : null}
                </span>
                <span
                  className={
                    index <= currentStep
                      ? styles.progressLabelActive
                      : styles.progressLabel
                  }
                >
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: reducedMotion ? 0 : 0.6,
            duration: reducedMotion ? 0.01 : 0.42,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={styles.aiHint}
          role="status"
        >
          <Sparkles className={styles.aiSparkles} size={22} strokeWidth={1.5} />
          <p>
            AI 生成中 <span>·</span> 大约需要 10–20 秒
          </p>
          <LoaderCircle className={styles.spinner} size={24} strokeWidth={2.5} />
        </motion.div>
      </section>
    </AppViewport>
  );
}
