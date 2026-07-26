import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.rishibiji.app",
  appName: "日食笔记",
  webDir: "mobile-shell",
  server: {
    allowNavigation: ["app.recipetix.top"],
    cleartext: false,
    errorPath: "error.html",
    url: "https://app.recipetix.top",
  },
};

export default config;
