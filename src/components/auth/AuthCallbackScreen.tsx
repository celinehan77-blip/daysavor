"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { AppViewport } from "@/components/layout/AppViewport";
import { getAuthClient } from "@/lib/auth/client";
import {
  migrateLatestLocalRecipeAfterLogin,
  syncLocalFavoritesToSupabase,
} from "@/lib/data";

const FAVORITE_SYNC_KEY_PREFIX = "recipe-ticket:favorites-synced-at";

function getFavoriteSyncKey(userId: string) {
  return `${FAVORITE_SYNC_KEY_PREFIX}:${userId}`;
}

function getCallbackParams(url: URL) {
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));

  return {
    get(name: string) {
      return url.searchParams.get(name) ?? hashParams.get(name);
    },
  };
}

function getSafeAuthErrorMessage(params: ReturnType<typeof getCallbackParams>) {
  const errorCode = params.get("error_code");
  const errorDescription = params.get("error_description");
  const error = params.get("error");

  if (!error && !errorCode && !errorDescription) {
    return "";
  }

  if (errorCode === "otp_expired") {
    return "登录链接已失效或已被使用，请重新发送登录邮件。";
  }

  if (errorCode === "access_denied") {
    return "登录链接被拒绝，请重新发送登录邮件后再试。";
  }

  return errorDescription || error || "登录链接无法完成验证，请重新发送。";
}

function getSafeExchangeErrorMessage(message?: string) {
  if (!message) {
    return "登录回调处理失败，请重新发送登录邮件。";
  }

  if (/code verifier/i.test(message)) {
    return "登录链接需要在发送邮件的同一个浏览器中打开，请重新发送登录邮件后在同一浏览器打开。";
  }

  if (/expired|invalid/i.test(message)) {
    return "登录链接已失效或已被使用，请重新发送登录邮件。";
  }

  return "登录回调处理失败，请重新发送登录邮件。";
}

async function syncFavoritesOnceAfterLogin(userId: string) {
  if (typeof window === "undefined") return;

  const syncKey = getFavoriteSyncKey(userId);

  if (window.localStorage.getItem(syncKey)) {
    return;
  }

  const result = await syncLocalFavoritesToSupabase();

  if (result.ok) {
    window.localStorage.setItem(syncKey, new Date().toISOString());
  }
}

export function AuthCallbackScreen() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const handleCallback = async () => {
      const supabase = getAuthClient();

      if (!supabase) {
        setErrorMessage("当前未配置 Supabase 登录。");
        return;
      }

      const currentUrl = new URL(window.location.href);
      const callbackParams = getCallbackParams(currentUrl);
      const callbackError = getSafeAuthErrorMessage(callbackParams);

      if (callbackError) {
        if (active) {
          setErrorMessage(callbackError);
        }
        return;
      }

      const code = callbackParams.get("code");
      const tokenHash = callbackParams.get("token_hash");
      const type = callbackParams.get("type") as EmailOtpType | null;
      const accessToken = callbackParams.get("access_token");
      const refreshToken = callbackParams.get("refresh_token");
      let sessionReady = false;

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          if (active) {
            setErrorMessage(getSafeExchangeErrorMessage(error.message));
          }
          return;
        }

        sessionReady = true;
      } else if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          if (active) {
            setErrorMessage(getSafeExchangeErrorMessage(error.message));
          }
          return;
        }

        sessionReady = Boolean(data.session);
      } else if (tokenHash && type) {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });

        if (error) {
          if (active) {
            setErrorMessage(getSafeExchangeErrorMessage(error.message));
          }
          return;
        }

        sessionReady = Boolean(data.session);
      } else {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          if (active) {
            setErrorMessage("登录链接无效或已过期，请重新发送。");
          }
          return;
        }

        sessionReady = true;
      }

      if (!sessionReady) {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          if (active) {
            setErrorMessage("登录状态没有成功写入浏览器，请重新发送登录邮件。");
          }
          return;
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        await migrateLatestLocalRecipeAfterLogin(user.id);
        await syncFavoritesOnceAfterLogin(user.id);
      }

      if (active) {
        router.replace("/me");
      }
    };

    void handleCallback();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <AppViewport>

      <div className="app-content flex flex-col items-center justify-center px-6 text-center">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="paper-card rounded-[28px] px-5 py-7"
        >
          <div className="relative z-10">
            {errorMessage ? (
              <>
                <h1 className="font-display text-[28px] tracking-[0.06em] text-[#3a2a1d]">
                  登录未完成
                </h1>
                <p className="mt-3 text-[13px] leading-6 text-[#a15f45]">
                  {errorMessage}
                </p>
                <Link
                  href="/login"
                  className="mx-auto mt-5 flex h-11 w-[142px] items-center justify-center gap-1.5 rounded-full bg-[#8a5a35] text-[14px] font-semibold text-[#fffaf2]"
                >
                  重新登录
                  <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <>
                <Loader2
                  size={28}
                  className="mx-auto animate-spin text-[#8a5a35]"
                />
                <h1 className="font-display mt-5 text-[28px] tracking-[0.06em] text-[#3a2a1d]">
                  正在登录
                </h1>
                <p className="mt-3 text-[13px] leading-6 text-[#75695f]">
                  正在确认你的邮箱登录链接
                </p>
              </>
            )}
          </div>
        </motion.section>
      </div>
    </AppViewport>
  );
}
