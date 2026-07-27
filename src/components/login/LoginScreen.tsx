"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Send, ShieldCheck } from "lucide-react";
import { AppViewport } from "@/components/layout/AppViewport";
import {
  canSendLoginEmail,
  getLoginCooldownMessage,
  getLoginSendButtonLabel,
  LOGIN_EMAIL_COOLDOWN_SECONDS,
} from "@/lib/auth/loginRateLimit";
import { signInWithEmail } from "@/lib/auth/session";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [isSending, setIsSending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const sendLockRef = useRef(false);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      sendLockRef.current ||
      !canSendLoginEmail({ isSending, cooldownSeconds })
    ) {
      return;
    }

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setMessageType("error");
      setMessage("请先输入邮箱");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setMessageType("error");
      setMessage("请输入有效的邮箱地址");
      return;
    }

    sendLockRef.current = true;
    setIsSending(true);
    setMessage("");

    const result = await signInWithEmail(trimmedEmail).catch(() => ({
      ok: false,
      message: "登录链接发送失败，请稍后再试。",
    }));

    sendLockRef.current = false;
    setIsSending(false);
    setMessageType(result.ok ? "success" : "error");

    if (result.ok) {
      setCooldownSeconds(LOGIN_EMAIL_COOLDOWN_SECONDS);
      setMessage(getLoginCooldownMessage(LOGIN_EMAIL_COOLDOWN_SECONDS));
    } else {
      setMessage(result.message);
    }
  };

  const sendState = { isSending, cooldownSeconds };
  const isSendDisabled = !canSendLoginEmail(sendState);
  const buttonLabel = getLoginSendButtonLabel(sendState);

  return (
    <AppViewport>

      <div className="app-content px-5 pt-3">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="pt-2"
        >
          <Link
            href="/me"
            className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#ded3c7]/70 bg-white/38 text-[#8a6f58]"
            aria-label="返回我的页面"
          >
            <ArrowLeft size={18} />
          </Link>
          <p className="text-[13px] font-semibold tracking-[0.22em] text-[#8a5a35]/75">
            Sign in
          </p>
          <h1 className="font-display mt-1 text-[38px] leading-none tracking-[0.08em] text-[#3a2a1d]">
            登录
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-[#75695f]">
            用于后续同步你的菜谱收藏
          </p>
        </motion.header>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45 }}
          className="paper-card mt-8 rounded-[28px] px-4 py-5"
        >
          <div className="relative z-10">
            <div className="flex h-[62px] items-center gap-3 rounded-[22px] border border-[#ded3c7]/70 bg-white/42 px-4 text-[#b4aaa1] shadow-inner">
              <Mail size={21} />
              <input
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);

                  if (message) {
                    setMessage("");
                  }
                }}
                type="email"
                inputMode="email"
                autoComplete="email"
                aria-label="邮箱"
                placeholder="输入邮箱"
                className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold tracking-[0.02em] text-[#7c6f64] outline-none placeholder:text-[#b4aaa1]"
              />
            </div>

            <button
              type="submit"
              disabled={isSendDisabled}
              className="mt-4 flex h-[54px] w-full items-center justify-center gap-2 rounded-[20px] bg-[#8a5a35] text-[16px] font-semibold tracking-[0.05em] text-[#fffaf2] shadow-[0_14px_28px_rgba(104,61,24,0.22)] disabled:opacity-60"
            >
              <Send size={17} />
              {buttonLabel}
            </button>

            {message ? (
              <p
                className={`mt-3 text-[13px] font-medium ${
                  messageType === "success" ? "text-[#6f7d55]" : "text-[#a15f45]"
                }`}
              >
                {message}
              </p>
            ) : null}

            <div className="mt-4 flex items-start gap-2 rounded-[20px] bg-[#fffaf2]/58 px-3 py-3 text-[12px] leading-5 text-[#75695f]">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#8b9a7a]" />
              <span>
                输入邮箱后，我们会发送一封登录链接。点击邮件里的链接即可完成登录。当前不需要密码。
              </span>
            </div>
          </div>
        </motion.form>
      </div>
    </AppViewport>
  );
}
