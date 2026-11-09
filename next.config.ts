import type { NextConfig } from "next";
const config: NextConfig = { poweredByHeader: false, serverExternalPackages: ["pino", "thread-stream"] };
export default config;
