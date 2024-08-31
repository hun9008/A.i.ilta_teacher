import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: translateX(-50%) rotate(0deg); }
  100% { transform: translateX(-50%) rotate(360deg); }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f8ff;
`;

const SpinnerWrapper = styled.div`
  position: relative;
  width: 200px;
  height: 200px;
`;

const LoadingSpinner = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.h2`
  margin-top: 20px;
  font-size: 24px;
  color: #333;
  font-family: Arial, sans-serif;
`;

const LoadingPage: React.FC = () => {
  return (
    <LoadingContainer>
      <SpinnerWrapper>
        <LoadingSpinner />
      </SpinnerWrapper>
      <LoadingText>로딩 중...</LoadingText>
    </LoadingContainer>
  );
};

export default LoadingPage;
