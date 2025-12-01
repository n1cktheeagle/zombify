'use client';

import React from 'react';
import ButtonBig, { ButtonBigProps } from './ButtonBig';

interface AnalyzeButtonProps extends ButtonBigProps {
  isAnalyzing: boolean;
  idleText?: string;
  analyzingText?: string;
}

export function AnalyzeButton({
  isAnalyzing,
  idleText = 'Analyze',
  analyzingText = 'ANALYZING',
  className,
  ...buttonProps
}: AnalyzeButtonProps) {
  const content = isAnalyzing ? (
    <span className="zombify-shimmer-label">
      {analyzingText}
    </span>
  ) : (
    idleText
  );

  return (
    <ButtonBig
      {...buttonProps}
      className={className}
    >
      {content}
    </ButtonBig>
  );
}


