import React from 'react';
import { Indicator, SystemMetadata } from '../types';
import { DataLog, DataAnomalyDetection, DataIntegrityMonitor } from './InstitutionalSections';

interface Props {
  indicators: Indicator[];
  metadata?: SystemMetadata | null;
  onViewActivityDetail?: () => void;
  retryKey?: number;
}

export const DataHealthMonitor: React.FC<Props> = ({ 
  indicators, 
  metadata, 
  onViewActivityDetail,
  retryKey
}) => {
  return (
    <div className="space-y-8">
      <DataLog
        indicators={indicators}
        metadata={metadata}
        onViewActivityDetail={onViewActivityDetail}
      />
      <DataAnomalyDetection
        indicators={indicators}
        retryKey={retryKey}
        onViewActivityDetail={onViewActivityDetail}
      />
      <DataIntegrityMonitor indicators={indicators} />
    </div>
  );
};
