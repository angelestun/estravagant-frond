import React from 'react';
import { useMediaQuery } from 'react-responsive';

const ResponsiveLayout = ({ children }) => {
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isTablet = useMediaQuery({ minWidth: 769, maxWidth: 1024 });
  const isDesktop = useMediaQuery({ minWidth: 1025 });

  return (
    <div className={`layout ${isMobile ? 'mobile' : ''} ${isTablet ? 'tablet' : ''} ${isDesktop ? 'desktop' : ''}`}>
      {children}
    </div>
  );
};

export default ResponsiveLayout;