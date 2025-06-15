import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { http, createConfig } from "wagmi";
import { base, arbitrum, mainnet, optimism, polygon, zora } from "wagmi/chains";

export const config = createConfig({
  chains: [ base, arbitrum, mainnet, optimism, polygon, zora ],
  connectors: [farcasterFrame()],
  transports: {
    [base.id]: http(),
    [arbitrum.id]: http(),
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
