import React from 'react';

const LoadingIndicator = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: '#7c4dff',
    zIndex: 9999,
    animation: 'loading 1s infinite'
  }}>
    <style>{`
      @keyframes loading {
        0% { width: 0; }
        50% { width: 65%; }
        100% { width: 100%; }
      }
    `}</style>
  </div>
);

export default LoadingIndicator;