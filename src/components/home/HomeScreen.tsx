"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Link2,
  ScanLine,
  Search,
  ShieldCheck,
} from "lucide-react";
import { AppViewport } from "@/components/layout/AppViewport";
import { TabBar } from "@/components/layout/TabBar";
import { LeafMark } from "@/components/ui/LeafMark";
import {
  beginPendingRecipeGeneration,
  consumePendingGenerationError,
  getGenerationStartRoute,
} from "@/lib/data/pendingRecipeGeneration";

export function HomeScreen() {
  const router = useRouter();
  const [sourceUrl, setSourceUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const generationLockRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const pendingError = consumePendingGenerationError();
      if (pendingError) {
        setErrorMessage(pendingError);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleGenerateRecipe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (generationLockRef.current) {
      return;
    }

    const trimmedSourceUrl = sourceUrl.trim();

    if (!trimmedSourceUrl) {
      setErrorMessage("请先粘贴菜谱正文或视频字幕");
      return;
    }

    setErrorMessage("");
    generationLockRef.current = true;
    setIsGenerating(true);
    try {
      const pending = await beginPendingRecipeGeneration(trimmedSourceUrl);
      router.push(getGenerationStartRoute(pending));
    } catch {
      generationLockRef.current = false;
      setIsGenerating(false);
      setErrorMessage("生成任务暂时无法启动，请稍后重试。");
    }
  };

  return (
    <AppViewport>

      <div className="app-content tab-page-content flex flex-col justify-center px-7 pb-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <LeafMark />
          <h1 className="font-display mt-7 text-[38px] leading-[1.22] tracking-[0.06em] text-[#5a3a20]">
            收藏每一道
            <br />
            属于你的好味道
          </h1>
          <p className="mt-5 text-[17px] font-medium leading-8 tracking-[0.08em] text-[#a2968a]">
            粘贴菜谱正文或字幕，生成干净菜谱
          </p>
        </motion.section>

        <motion.form
          onSubmit={handleGenerateRecipe}
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel mt-10 rounded-[28px] p-5"
        >
          <div className="flex h-[70px] items-center gap-4 rounded-[22px] border border-[#ded3c7]/70 bg-white/42 px-5 text-[#b4aaa1] shadow-inner">
            <Link2 size={23} />
            <input
              value={sourceUrl}
              onChange={(event) => {
                setSourceUrl(event.target.value);

                if (errorMessage) {
                  setErrorMessage("");
                }
              }}
              aria-label="粘贴菜谱正文或视频字幕"
              placeholder="粘贴菜谱正文或视频字幕"
              className="min-w-0 flex-1 bg-transparent text-left text-[18px] font-semibold tracking-[0.03em] text-[#7c6f64] outline-none placeholder:text-[#b4aaa1]"
            />
            <ScanLine size={24} className="text-[#7c5638]" />
          </div>

          {errorMessage ? (
            <p className="mt-2 text-left text-[13px] font-medium text-[#a15f45]">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isGenerating}
            className="block w-full border-0 bg-transparent p-0 text-left"
          >
            <motion.div
              whileTap={{ scale: 0.985 }}
              className="mt-5 flex h-[64px] items-center justify-center rounded-[20px] bg-gradient-to-r from-[#8a4f1f] via-[#955d28] to-[#8a4f1f] text-[20px] font-semibold tracking-[0.08em] text-white shadow-[0_18px_34px_rgba(104,61,24,0.28)]"
            >
              <span className="flex-1 text-center">生成菜谱</span>
              <span className="mr-3 grid h-10 w-10 place-items-center rounded-full bg-white/16">
                <ArrowRight size={22} />
              </span>
            </motion.div>
          </button>
        </motion.form>

        <Link
          href="/search"
          className="mx-auto mt-4 flex h-10 items-center justify-center gap-2 rounded-full border border-[#ded3c7]/70 bg-white/34 px-4 text-[13px] font-semibold text-[#8a6f58] shadow-[0_10px_24px_rgba(74,48,27,0.06)]"
        >
          <Search size={15} />
          找一道想做的菜
        </Link>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.34, duration: 0.6 }}
          className="mt-6 flex items-center justify-center gap-3 text-[14px] font-medium text-[#9b9086]"
        >
          <ShieldCheck size={17} className="fill-[#8b9a7a] text-[#8b9a7a]" />
          <span>仅识别公开内容</span>
          <span>·</span>
          <span>安全</span>
          <span>·</span>
          <span>无广告</span>
        </motion.div>
      </div>

      <TabBar current="home" />
    </AppViewport>
  );
}
