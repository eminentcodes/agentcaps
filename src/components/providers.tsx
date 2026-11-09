"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { chain } from "@/lib/network";
import { MotionConfig } from "motion/react";
const config = createConfig({ chains: [chain], connectors: [injected()], transports: { [chain.id]: http(process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org") }, ssr: true });
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }));
  return <WagmiProvider config={config}><QueryClientProvider client={queryClient}><MotionConfig reducedMotion="user">{children}</MotionConfig></QueryClientProvider></WagmiProvider>;
}
