import { useState, useEffect, useCallback } from 'react';
import { useAccount, useBalance, useChainId, usePublicClient, useWalletClient, useSwitchChain } from 'wagmi';
import erc20ABI from '../data/abi/Erc20Abi.json';
import { parseEther, parseUnits, formatEther, formatUnits } from 'viem';
import { useDomains } from '../hooks/useDomains';
import chains from '../data/chains.json';
import tokens from '../data/tokens.json';
import ConnectButton from './ConnectButton';

export const SendTokens = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { getDomainHolder } = useDomains();

  const [filterNetwork, setFilterNetwork] = useState('');
  const [filterTokens, setFilterTokens] = useState('');
  const [receiver, setReceiver] = useState('');
  const [receiverAddress, setReceiverAddress] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [selectedToken, setSelectedToken] = useState('');
  const [selectedTokenDecimals, setSelectedTokenDecimals] = useState(18);
  const [tokenAmount, setTokenAmount] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [status, setStatus] = useState('');

  const { data: balance } = useBalance({
    address,
    token: selectedToken && tokens[chainId]?.[selectedToken] !== '0x0' 
      ? tokens[chainId][selectedToken] as `0x${string}`
      : undefined,
  });

  useEffect(() => {
    if (isConnected && chainId && tokens[chainId]) {
      const firstToken = Object.keys(tokens[chainId])[0];
      setSelectedToken(firstToken);
    }
  }, [isConnected, chainId]);

  useEffect(() => {
    if (balance) {
      setTokenBalance(balance.formatted);
    }
  }, [balance]);

  const getNetworks = useCallback(() => {
    const networkNames = chains.map(chain => chain.name);
    if (filterNetwork) {
      return networkNames.filter(item => 
        item.toUpperCase().includes(filterNetwork.toUpperCase())
      );
    }
    return networkNames;
  }, [filterNetwork]);

  const getTokenNames = useCallback(() => {
    if (!chainId || !tokens[chainId]) return [];
    
    const tokenList = Object.keys(tokens[chainId]);
    if (!filterTokens) return tokenList;
    
    return tokenList.filter(item => 
      item.toUpperCase().includes(filterTokens.toUpperCase())
    );
  }, [chainId, filterTokens]);

  const isNotValid = useCallback(() => {
    if (!receiver) return true;
    if (!receiver.includes('.')) return true;
    if (receiver.includes(' ')) return true;
    if (receiver.includes('%')) return true;
    if (receiver.includes('&')) return true;
    if (receiver.includes('?')) return true;
    if (receiver.includes('#')) return true;
    if (receiver.includes('/')) return true;
    if (!tokenAmount) return true;
    if (isNaN(Number(tokenAmount))) return true;
    if (Number(tokenAmount) <= 0) return true;
    if (Number(tokenAmount) > Number(tokenBalance)) return true;
    return false;
  }, [receiver, tokenAmount, tokenBalance]);

  const handleSend = async () => {
    if (!address || !walletClient || !publicClient) return;
    
    setWaiting(true);
    setStatus('');

    try {
      const holder = await getDomainHolder(receiver);
      
      if (!holder || holder === '0x0000000000000000000000000000000000000000') {
        setStatus('This name does not have an owner. Sending aborted.');
        setWaiting(false);
        return;
      }

      if (holder.toLowerCase() === address.toLowerCase()) {
        setStatus('The receiver name is yours. You cannot send tokens to yourself.');
        setWaiting(false);
        return;
      }

      setReceiverAddress(holder);

      if (tokens[chainId][selectedToken] === '0x0') {
        await sendNativeTokens(holder);
      } else {
        await sendErc20Tokens(holder);
      }
    } catch (error) {
      console.error(error);
      setStatus(error instanceof Error ? error.message : 'An error occurred');
      setWaiting(false);
    }
  };

  const sendErc20Tokens = async (holder: string) => {
    if (!address || !walletClient || !publicClient) return;

    try {
      const tokenAddress = tokens[chainId][selectedToken] as `0x${string}`;
      const valueWei = parseUnits(tokenAmount, selectedTokenDecimals);

      const { request } = await publicClient.simulateContract({
        address: tokenAddress,
        abi: erc20ABI,
        functionName: 'transfer',
        args: [holder, valueWei],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      setStatus('Transaction submitted. Waiting for confirmation...');

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        setStatus(`Successfully sent ${tokenAmount} ${selectedToken} to ${receiver}!`);
        setTokenAmount('');
      } else {
        setStatus('Transaction failed.');
      }
    } catch (error) {
      console.error(error);
      setStatus(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setWaiting(false);
    }
  };

  const sendNativeTokens = async (holder: string) => {
    if (!address || !walletClient) return;

    try {
      const valueWei = parseEther(tokenAmount);
      
      const hash = await walletClient.sendTransaction({
        to: holder,
        value: valueWei,
      });

      setStatus('Transaction submitted. Waiting for confirmation...');

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        setStatus(`Successfully sent ${tokenAmount} ${selectedToken} to ${receiver}!`);
        setTokenAmount('');
      } else {
        setStatus('Transaction failed.');
      }
    } catch (error) {
      console.error(error);
      setStatus(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setWaiting(false);
    }
  };

  const formatTokenBalance = () => {
    if (Number(tokenBalance) > 100) {
      return Number(tokenBalance).toFixed(2);
    }
    return Number(tokenBalance).toFixed(4);
  };

  return (
    <div className="d-flex justify-content-center">
      <div className="card text-white bg-primary send-tokens-card">
        <div className="card-body text-center">
          {!isConnected ? (
            <ConnectButton className="btn btn-primary" />
          ) : (
            <>
              {/* Network Selection */}
              <div className="dropdown">
                <button 
                  className="btn btn-primary dropdown-toggle" 
                  type="button" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                >
                  {chainId ? `Send on ${chains.find(c => c.id === chainId)?.name || 'Unknown'}` : 'Select Network'}
                </button>
                
                <div className="dropdown-menu p-2 dropdown-menu-end">
                  <div className="mb-3">
                    <input 
                      className="form-control mb-2" 
                      placeholder="Find network"
                      value={filterNetwork}
                      onChange={(e) => setFilterNetwork(e.target.value)}
                    />
                    {getNetworks().map((networkName) => (
                      <button 
                        key={networkName}
                        className="dropdown-item py-2" 
                        type="button"
                        style={{ fontSize: '1.1rem' }}
                        onClick={() => switchChain({ chainId: chains.find(c => c.name === networkName)?.id })}
                      >
                        Switch to {networkName}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recipient Input */}
              <div className="mt-4">
                <input 
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  className="form-control form-control-lg text-center"
                  placeholder="Receiver's domain name"
                />
              </div>

              {/* Token Amount and Selection */}
              <div className="input-group mt-3">
                <input 
                  type="text" 
                  className="form-control form-control-lg text-end"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  placeholder="0.0" 
                />

                <div className="dropdown">
                  <button 
                    className="btn btn-dark btn-lg dropdown-toggle" 
                    type="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    {selectedToken}
                  </button>
                  
                  <div className="dropdown-menu p-2 dropdown-menu-end">
                    <div className="mb-3">
                      <input 
                        className="form-control mb-2" 
                        placeholder="Filter tokens"
                        value={filterTokens}
                        onChange={(e) => setFilterTokens(e.target.value)}
                      />
                      {getTokenNames().map((token) => (
                        <button 
                          key={token}
                          className="dropdown-item py-2" 
                          type="button"
                          style={{ fontSize: '1.1rem' }}
                          onClick={() => setSelectedToken(token)}
                        >
                          {token}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance Display */}
              <div className="mt-1">
                <p>
                  Balance:<span className="ms-1"></span>
                  <span 
                    style={{ cursor: 'pointer' }}
                    onClick={() => setTokenAmount(tokenBalance)}
                  >
                     {formatTokenBalance()} {selectedToken}
                  </span>
                </p>
              </div>

              {/* Send Button */}
              <button
                className="btn btn-lg btn-dark mt-2 mb-2"
                disabled={isNotValid() || waiting}
                onClick={handleSend}
              >
                {waiting ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                ) : null}
                Send tokens
              </button>

              {/* Status Message */}
              {status && (
                <p className="mt-3 mb-0" style={{ color: status.includes('Successfully') ? 'green' : 'red' }}>
                  {status}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
