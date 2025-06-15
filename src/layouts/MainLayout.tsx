import { ReactNode } from 'react';
import Navbar from '../components/Navbar';

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <Navbar />
      <div className="container mt-4">
        {children}
      </div>
    </>
  );
}

export default MainLayout; 