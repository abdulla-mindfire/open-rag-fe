// components/Loader.js
import React from 'react';

const Loader = ({ size = 'medium', color = '#000' }) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return '20px';
      case 'large':
        return '60px';
      default:
        return '40px';
    }
  };

  const loaderStyle = {
    width: getSize(),
    height: getSize(),
    border: `4px solid ${color}`,
    borderTop: `4px solid transparent`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  return <div style={loaderStyle} />;
};

export default Loader;
