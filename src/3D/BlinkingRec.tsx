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

  return (
    <div className="flex items-center">
      <div className={`w-3 h-3 rounded-full mr-2 ${isVisible ? 'bg-green-400' : 'bg-transparent'}`} />
      <span>{text}</span>
    </div>
  );
};

export default BlinkingRec;