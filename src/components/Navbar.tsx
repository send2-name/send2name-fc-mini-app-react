import React, { useState } from 'react';
import { useAccount, useBalance, useSwitchChain, useDisconnect } from 'wagmi';
import { formatEther } from 'viem';
import { Link } from 'react-router-dom';
import { sdk } from '@farcaster/frame-sdk';
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

  const handleAddFavorite = async () => {
    try {
      const result = await sdk.actions.addFrame();
      console.log('Add to favorites result:', result);
      // Handle the result based on what the SDK returns
      if (result) {
        console.log('Added to favorites!');
      }
    } catch (err) {
      console.error('Error adding frame:', err);
    }
  };

  const handleShare = async () => {
    try {
      await sdk.actions.composeCast({
        text: "Check out Send2.name - A Mini App to send tokens to any web3 domain name! 💸",
        embeds: [window.location.href]
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
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
                  <Link to="/" className="btn btn-primary btn-lg w-100" onClick={handleClose}>Home</Link>
                </li>
                <li className="nav-item mb-4">
                  <Link to="/about" className="btn btn-primary btn-lg w-100" onClick={handleClose}>About</Link>
                </li>

                {isConnected && (
                  <>
                    <li className="nav-item dropdown mb-4">
                      <button 
                        className="btn btn-primary btn-lg w-100 dropdown-toggle network-dropdown" 
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
                        className="btn btn-primary btn-lg w-100 dropdown-toggle" 
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
                      className="btn btn-primary btn-lg w-100"
                    />
                  </li>
                )}

                <li className="nav-item mb-4">
                  <button 
                    className="btn btn-success btn-lg w-100" 
                    onClick={handleAddFavorite}
                  >
                    Add to favorites
                  </button>
                </li>

                <li className="nav-item mb-4">
                  <button 
                    className="btn btn-info btn-lg w-100" 
                    onClick={handleShare}
                  >
                    Share on Farcaster
                  </button>
                </li>

                <li className="nav-item mb-4">
                  <button className="btn btn-warning btn-lg w-100" onClick={handleClose}>Close menu</button>
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