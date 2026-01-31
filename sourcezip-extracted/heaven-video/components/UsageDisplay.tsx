import React from 'react';
import { usageService, USAGE_LIMITS } from '../services/usageService';

type UsageLimits = typeof USAGE_LIMITS;
type UsageData = ReturnType<typeof usageService.getUsage>;

interface UsageDisplayProps {
  usage: UsageData;
  limits: UsageLimits;
}

const USAGE_LABELS: Record<keyof UsageLimits, string> = {
  generateStoryboard: 'Storyboard Generation',
  generateImage: 'Image Generations',
  generateVideo: 'Video Generations',
};

const UsageMeter: React.FC<{ label: string; count: number; limit: number }> = ({ label, count, limit }) => {
  const percentage = limit > 0 ? (count / limit) * 100 : 0;
  const isHighUsage = percentage > 80;
  
  return (
    <div className="text-xs">
      <div className="flex justify-between font-semibold text-gray-600 mb-1">
        <span>{label}</span>
        <span>{count} / {limit}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${isHighUsage ? 'bg-red-500' : 'bg-blue-500'}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export const UsageDisplay: React.FC<UsageDisplayProps> = ({ usage, limits }) => {
  return (
    <div className="space-y-3">
      {(Object.keys(limits) as Array<keyof UsageLimits>).map(key => (
        <UsageMeter
          key={key}
          label={USAGE_LABELS[key]}
          count={usage[key].count}
          limit={limits[key]}
        />
      ))}
    </div>
  );
};
