import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

interface ConnectButtonProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
  className?: string;
}

const ConnectButton: React.FC<ConnectButtonProps> = ({ 
  onConnect, 
  onDisconnect,
  className = 'btn btn-primary'
}) => {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    connect({ connector: connectors[0] });
    onConnect?.();
  };

  const handleDisconnect = () => {
    disconnect();
    onDisconnect?.();
  };

  return (
    <button 
      className={className}
      onClick={isConnected ? handleDisconnect : handleConnect}
    >
      {isConnected ? 'Disconnect' : 'Connect Wallet'}
    </button>
  );
};

export default ConnectButton; 