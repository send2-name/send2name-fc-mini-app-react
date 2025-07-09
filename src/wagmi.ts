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
      http: [
        "https://arb1.arbitrum.io/rpc",
        "https://arbitrum.meowrpc.com",
        "https://rpc.ankr.com/arbitrum",
        "https://arbitrum-one.public.blastapi.io"
      ], 
    },
    public: {
      http: [
        "https://arb1.arbitrum.io/rpc",
        "https://arbitrum.meowrpc.com",
        "https://rpc.ankr.com/arbitrum",
        "https://arbitrum-one.public.blastapi.io"
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Arbiscan",
      url: "https://arbiscan.io",
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 7654707,
    },
  },
  //fees: {baseFeeMultiplier: 0,},
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
