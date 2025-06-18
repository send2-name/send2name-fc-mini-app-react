import { useMemo } from "react";
import { useAccount, useChainId } from "wagmi";
import { useTokenBalances } from "../hooks/useTokenBalances";

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
