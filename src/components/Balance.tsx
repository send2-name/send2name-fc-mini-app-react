import { useMemo, useState, useEffect } from "react";
import { useAccount, useChainId, useBalance, usePublicClient } from "wagmi";
import tokens from "../data/tokens.json";
import erc20Abi from "../data/abi/Erc20Abi.json";

interface TokenBalances {
  [tokenTicker: string]: string;
}

interface TokenData {
  ticker: string;
  address: string;
  isNative: boolean;
}

interface TokenBalance {
  ticker: string;
  balance: string;
  isLoading: boolean;
  error?: Error;
}

// Custom hook to fetch balances for all tokens on a chain
function useTokenBalances(chainId: number, address: string | undefined) {
  const publicClient = usePublicClient();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get current chain tokens
  const chainTokens = useMemo(() => {
    if (!chainId) return {};
    const tokensForChain = tokens[String(chainId) as keyof typeof tokens];
    return tokensForChain || {};
  }, [chainId]);

  const tokenList = useMemo(() => {
    if (!chainTokens) return [];
    
    return Object.entries(chainTokens).map(([ticker, address]) => ({
      ticker,
      address,
      isNative: address === "0x0"
    }));
  }, [chainTokens]);

  // Fetch native token balance
  const { data: nativeBalance, isLoading: nativeLoading } = useBalance({
    address: address as `0x${string}`,
    query: {
      enabled: !!address,
    },
  });

  // Fetch all ERC20 token balances
  useEffect(() => {
    if (!address || !publicClient || !chainId) {
      setTokenBalances([]);
      return;
    }

    const fetchTokenBalances = async () => {
      setIsLoading(true);
      const erc20Tokens = tokenList.filter(token => !token.isNative);
      
      try {
        // Fetch balances for each token individually
        const balancePromises = erc20Tokens.map(async (token) => {
          try {
            // Get balance
            const balanceResult = await publicClient.readContract({
              address: token.address as `0x${string}`,
              abi: erc20Abi as any,
              functionName: 'balanceOf',
              args: [address as `0x${string}`],
            });

            // Get decimals
            const decimalsResult = await publicClient.readContract({
              address: token.address as `0x${string}`,
              abi: erc20Abi as any,
              functionName: 'decimals',
              args: [],
            });

            const balanceInTokens = parseFloat(balanceResult.toString()) / Math.pow(10, Number(decimalsResult));
            
            return {
              ticker: token.ticker,
              balance: balanceInTokens > 0 ? balanceInTokens.toString() : "0",
              isLoading: false,
            };
          } catch (err) {
            return {
              ticker: token.ticker,
              balance: "0",
              isLoading: false,
              error: err as Error,
            };
          }
        });

        const balances = await Promise.all(balancePromises);
        setTokenBalances(balances);
      } catch (error) {
        console.error('Error fetching token balances:', error);
        setTokenBalances([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenBalances();
  }, [address, publicClient, chainId, tokenList]);

  // Combine native and ERC20 balances
  const allBalances = useMemo(() => {
    const balances: TokenBalances = {};

    // Add native token balance
    const nativeToken = tokenList.find(token => token.isNative);
    if (nativeToken && nativeBalance) {
      const balanceInEth = parseFloat(nativeBalance.formatted);
      if (balanceInEth > 0) {
        balances[nativeToken.ticker] = balanceInEth.toString();
      }
    }

    // Add ERC20 token balances
    tokenBalances.forEach(({ ticker, balance, error }) => {
      if (!error && parseFloat(balance) > 0) {
        balances[ticker] = balance;
      }
    });

    return balances;
  }, [tokenList, nativeBalance, tokenBalances]);

  return {
    balances: allBalances,
    isLoading: isLoading || nativeLoading,
  };
}

export default function Balance() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const { balances, isLoading: isLoadingBalances } = useTokenBalances(chainId, address);

  // Filter out zero balances and format the data
  const currentTokens = useMemo(() => {
    const filtered = Object.entries(balances).filter(([key, value]) => {
      return !String(value).startsWith("0x") && Number(value) > 0;
    });
    return Object.fromEntries(filtered);
  }, [balances]);

  if (!isConnected) {
    return null;
  }

  return (
    <div className="d-flex justify-content-center">
      <div className="card text-white bg-secondary balances-card">
        <div className="card-body text-center">
          <button className="btn btn-secondary text-uppercase mb-3">
            Your tokens
            {isLoadingBalances && (
              <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
            )}
          </button>

          <table className="table table-hover table-secondary table-borderless">
            <tbody>
              {Object.entries(currentTokens).map(([tokenTicker, tokenBalance]) => (
                <tr key={tokenTicker}>
                  <td>{tokenTicker}</td>
                  <td>{Number.parseFloat(tokenBalance).toFixed(4)}</td>
                  {/* <td>Swap</td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
