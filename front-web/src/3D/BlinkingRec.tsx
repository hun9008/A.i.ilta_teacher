import React, { useState, useEffect } from 'react';

interface BlinkingRecProps {
  text: string;
}

const BlinkingRec: React.FC<BlinkingRecProps> = ({ text }) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    const interval = setInterval(() => setIsVisible(prev => !prev), 500);
    return () => clearInterval(interval);
  }, []);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    borderRadius: '4px',
  };

  const circleStyle: React.CSSProperties = {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    marginRight: '8px',
    backgroundColor: isVisible ? '#4ade80' : 'transparent',
    transition: 'background-color 0.2s'
  };

  const textStyle: React.CSSProperties = {
    color: 'black',
  };

  return (
    <div style={containerStyle}>
      <div style={circleStyle} />
      <span style={textStyle}>{text}</span>
    </div>
  );
};

export default BlinkingRec;