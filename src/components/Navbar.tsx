import React, { useState } from 'react';
import { useAccount, useBalance, useSwitchChain, useDisconnect } from 'wagmi';
import { formatEther } from 'viem';
import { Link } from 'react-router-dom';
import ConnectButton from './ConnectButton';
import chains from '../data/chains.json';

type SupportedChainId = 1 | 10 | 42161 | 8453 | 137 | 7777777;

type Chain = {
  id: SupportedChainId;
  name: string;
  nativeCurrency: string;
  blockExplorer: string;
};

const Navbar: React.FC = () => {
  const [show, setShow] = useState(false);
  const { address, chainId, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address,
  });
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const handleDisconnect = () => {
    disconnect();
    handleClose();
  };

  const getShortAddress = () => {
    if (address) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return null;
  };

  const getUserBalance = () => {
    if (balance) {
      return parseFloat(Number(formatEther(balance.value)).toFixed(4));
    }
    return null;
  };

  const getCurrentChain = () => {
    return (chains as Chain[]).find(chain => chain.id === chainId) || chains[0];
  };

  const getBlockExplorerUrl = () => {
    if (!address) return '';
    const chain = getCurrentChain();
    return `${chain.blockExplorer}/address/${address}`;
  };

  const getChainName = () => {
    const chain = getCurrentChain();
    return chain.name;
  };

  const getNativeCurrency = () => {
    const chain = getCurrentChain();
    return chain.nativeCurrency;
  };

  return (
    <>
      <nav className="navbar bg-primary" data-bs-theme="dark">
        <div className="container-fluid">
          <Link to="/" className="navbar-brand">
            <img className="img-fluid navbar-img" src="/img/logo.svg" alt="Send2Name" />
          </Link>

          <button 
            className="navbar-toggler" 
            type="button" 
            onClick={handleShow}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div 
            className={`offcanvas offcanvas-end ${show ? 'show' : ''}`} 
            tabIndex={-1} 
            id="offcanvasNavbar" 
            aria-labelledby="offcanvasNavbarLabel"
            data-bs-theme="dark"
            style={{ visibility: show ? 'visible' : 'hidden' }}
          >
            <div className="offcanvas-header">
              <h5 className="offcanvas-title" id="offcanvasNavbarLabel">Menu</h5>
              <button 
                type="button" 
                className="btn-close custom-close" 
                onClick={handleClose}
                aria-label="Close"
              ></button>
            </div>
            <div className="offcanvas-body">
              <ul className="navbar-nav justify-content-end flex-grow-1 pe-3">
                <li className="nav-item mb-4">
                  <Link to="/about" className="btn btn-primary" onClick={handleClose}>About</Link>
                </li>

                {isConnected && (
                  <>
                    <li className="nav-item dropdown mb-4">
                      <button 
                        className="btn btn-primary dropdown-toggle network-dropdown" 
                        data-bs-toggle="dropdown" 
                        type="button" 
                        aria-haspopup="true" 
                        aria-expanded="false"
                      >
                        {getChainName()}
                      </button>

                      <div className="dropdown-menu p-2 dropdown-menu-end set-cursor-pointer">
                        {chains.map((chain) => (
                          <span 
                            key={chain.id}
                            className="dropdown-item"
                            onClick={() => switchChain({ chainId: chain.id as SupportedChainId })}
                          >
                            {chain.name}
                          </span>
                        ))}
                      </div>
                    </li>

                    <li className="nav-item dropdown mb-4">
                      <button 
                        className="btn btn-primary dropdown-toggle" 
                        data-bs-toggle="dropdown" 
                        type="button" 
                        aria-haspopup="true" 
                        aria-expanded="false"
                      >
                        {getShortAddress()}
                      </button>

                      <div className="dropdown-menu dropdown-menu-end set-cursor-pointer">
                        <a 
                          href={getBlockExplorerUrl()} 
                          className="short-address text-decoration-none" 
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="dropdown-item">
                            {getShortAddress()}
                          </span>
                        </a>
                        
                        {getUserBalance() && (
                          <span className="dropdown-item">
                            {getUserBalance()} {getNativeCurrency()}
                          </span>
                        )}

                        <span className="dropdown-item" onClick={handleDisconnect}>Disconnect</span>
                      </div>
                    </li>
                  </>
                )}

                {!isConnected && (
                  <li className="nav-item mb-4">
                    <ConnectButton 
                      onConnect={handleClose}
                      className="btn btn-primary"
                    />
                  </li>
                )}

                <li className="nav-item mb-4">
                  <button className="btn btn-warning" onClick={handleClose}>Close menu</button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
      {show && (
        <div className="offcanvas-backdrop fade show" onClick={handleClose}></div>
      )}
    </>
  );
};

export default Navbar; 