import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { http, createConfig } from "wagmi";
import { base, mainnet, optimism, polygon, zora, degen, gnosis } from "wagmi/chains";

// Custom Arbitrum chain definition
const arbitrum = {
  id: 42161,
  name: "Arbitrum",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://arbitrum.meowrpc.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arbiscan",
      url: "https://arbiscan.io",
    },
  },
} as const;

export const config = createConfig({
  chains: [ arbitrum, base, degen, gnosis, mainnet, optimism, polygon, zora ],
  connectors: [farcasterFrame()],
  transports: {
    [arbitrum.id]: http(),
    [base.id]: http(),
    [degen.id]: http(),
    [gnosis.id]: http(),
    [mainnet.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
    [zora.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
