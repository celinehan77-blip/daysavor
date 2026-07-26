import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { PublicSourcePlatform } from "@/lib/source/types";

const PLATFORM_HOSTS: Record<PublicSourcePlatform, string[]> = {
  xiaohongshu: ["xiaohongshu.com", "xhslink.com", "xhslink.cn"],
  douyin: ["douyin.com", "iesdouyin.com"],
};

export type HostLookup = (
  hostname: string,
) => Promise<Array<{ address: string; family: number }>>;

export type ValidatedSourceUrl = {
  platform: PublicSourcePlatform;
  url: URL;
};

function matchesPlatformHost(hostname: string, rootHost: string) {
  return hostname === rootHost || hostname.endsWith(`.${rootHost}`);
}

export function identifySourcePlatform(
  hostname: string,
): PublicSourcePlatform | null {
  const normalizedHostname = hostname.toLowerCase().replace(/\.$/, "");

  for (const [platform, hosts] of Object.entries(PLATFORM_HOSTS) as Array<
    [PublicSourcePlatform, string[]]
  >) {
    if (hosts.some((host) => matchesPlatformHost(normalizedHostname, host))) {
      return platform;
    }
  }

  return null;
}

export function validateSourceUrl(
  sourceUrl: string,
  expectedPlatform?: PublicSourcePlatform,
): ValidatedSourceUrl | null {
  let url: URL;

  try {
    url = new URL(sourceUrl);
  } catch {
    return null;
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443")
  ) {
    return null;
  }

  const platform = identifySourcePlatform(url.hostname);

  if (!platform || (expectedPlatform && platform !== expectedPlatform)) {
    return null;
  }

  return { platform, url };
}

export function upgradeInitialPlatformUrl(sourceUrl: string) {
  let url: URL;

  try {
    url = new URL(sourceUrl);
  } catch {
    return sourceUrl;
  }

  if (
    url.protocol === "http:" &&
    !url.username &&
    !url.password &&
    !url.port &&
    identifySourcePlatform(url.hostname)
  ) {
    url.protocol = "https:";
    return url.toString();
  }

  return sourceUrl;
}

function isPrivateIpv4(address: string) {
  const octets = address.split(".").map(Number);

  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return true;
  }

  const [a, b] = octets;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51) ||
    (a === 203 && b === 0) ||
    a >= 224
  );
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase();

  if (normalized.startsWith("::ffff:")) {
    return isPrivateIpv4(normalized.slice("::ffff:".length));
  }

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8:")
  );
}

export function isPublicIpAddress(address: string) {
  const family = isIP(address);

  if (family === 4) {
    return !isPrivateIpv4(address);
  }

  if (family === 6) {
    return !isPrivateIpv6(address);
  }

  return false;
}

export const defaultHostLookup: HostLookup = async (hostname) =>
  lookup(hostname, { all: true, verbatim: true });

export async function hasOnlyPublicAddresses(
  hostname: string,
  lookupHost: HostLookup = defaultHostLookup,
) {
  try {
    const addresses = await lookupHost(hostname);
    return (
      addresses.length > 0 &&
      addresses.every(({ address }) => isPublicIpAddress(address))
    );
  } catch {
    return false;
  }
}

export function sanitizeSourceUrl(url: URL) {
  const sanitizedUrl = new URL(url.origin + url.pathname);
  return sanitizedUrl.toString();
}
