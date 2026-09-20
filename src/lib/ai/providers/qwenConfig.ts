export function getQwenApiKey() {
  return process.env.ALIBABA_ASR_API_KEY || process.env.ALIYUN_MAAS_API_KEY || null;
}

export function getQwenCompatibleEndpoint() {
  const baseUrl =
    process.env.ALIBABA_ASR_BASE_URL || process.env.ALIYUN_MAAS_ENDPOINT;
  if (!baseUrl) return null;

  const normalized = baseUrl.replace(/\/$/, "");
  return normalized.endsWith("/chat/completions")
    ? normalized
    : `${normalized}/chat/completions`;
}
