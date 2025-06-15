import { useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { Resolution } from '@unstoppabledomains/resolution';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'wagmi/chains';
import domains from '../data/domains.json';
import domainChains from '../data/domainChains.json';

type DomainType = 'ENS' | 'UD' | 'PD';

interface DomainInfo {
  chainId: number;
  address?: string;
  protocol: DomainType;
}

export const useDomains = () => {
  const publicClient = usePublicClient();
  const publicClientEns = createPublicClient({
    chain: mainnet,
    transport: http()
  });
  const resolution = new Resolution({
    sourceConfig: {
      uns: {
        locations: {
          Layer1: {
            url: "https://rpc.ankr.com/eth",
            network: 'mainnet'
          },
          Layer2: {
            url: "https://polygon-rpc.com",
            network: 'polygon-mainnet',
          },
        },
      },
    },
  });

  const getDomainHolder = useCallback(async (domain: string): Promise<string | null> => {
    try {
      // Split domain into name and extension
      const lastDotIndex = domain.lastIndexOf('.');
      if (lastDotIndex === -1) return null;
      
      const domainName = domain.slice(0, lastDotIndex);
      const extension = domain.slice(lastDotIndex);
      
      // Get domain info from our domains.json
      const domainInfo = domains[extension as keyof typeof domains] as DomainInfo | undefined;
      if (!domainInfo) return null;

      switch (domainInfo.protocol) {
        case 'ENS': {
          try {
            const address = await publicClientEns.getEnsAddress({
              name: domain
            });
            return address || null;
          } catch (error) {
            console.error('Error resolving ENS:', error);
            return null;
          }
        }
        
        case 'UD': {
          try {
            const address = await resolution.addr(domain, 'ETH');
            return address || null;
          } catch (error) {
            console.error('Error resolving UD domain:', error);
            return null;
          }
        }
        
        case 'PD': {
          if (!domainInfo.address) return null;
          
          // Find the chain configuration for this domain
          const chainConfig = domainChains.find(chain => chain.id === domainInfo.chainId);
          if (!chainConfig) {
            console.error(`Chain configuration not found for chainId ${domainInfo.chainId}`);
            return null;
          }

          // Create a public client for the specific chain
          const publicClientPd = createPublicClient({
            chain: {
              id: chainConfig.id,
              name: chainConfig.name,
              nativeCurrency: {
                name: chainConfig.nativeCurrency,
                symbol: chainConfig.nativeCurrency,
                decimals: 18
              },
              rpcUrls: { default: { http: [chainConfig.rpc] } },
              blockExplorers: { default: { name: chainConfig.name, url: chainConfig.blockExplorer } }
            },
            transport: http()
          });
          
          const contract = {
            address: domainInfo.address as `0x${string}`,
            abi: [{
              name: 'getDomainHolder',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ name: 'domainName', type: 'string' }],
              outputs: [{ name: '', type: 'address' }]
            }]
          };

          const address = await publicClientPd.readContract({
            ...contract,
            functionName: 'getDomainHolder',
            args: [domainName]
          }) as `0x${string}`;

          return address === '0x0000000000000000000000000000000000000000' ? null : address;
        }
        
        default:
          return null;
      }
    } catch (error) {
      console.error('Error resolving domain holder:', error);
      return null;
    }
  }, [publicClient, publicClientEns, resolution]);

  return {
    getDomainHolder
  };
};
