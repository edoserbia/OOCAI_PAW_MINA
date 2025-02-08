import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  isGenerating: boolean;
  duration?: number; // 进度条持续时间，默认15秒
}

export function ProgressBar({ isGenerating, duration = 15000 }: ProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    if (!isGenerating) {
      setProgress(0);
      setIsBlinking(false);
      return;
    }

    // 计算每个间隔需要增加的进度
    const interval = 100; // 每100ms更新一次
    const steps = duration / interval;
    const increment = 99 / steps;
    let currentProgress = 0;

    const timer = setInterval(() => {
      if (currentProgress < 99) {
        currentProgress += increment;
        setProgress(Math.min(currentProgress, 99));
      } else {
        setIsBlinking(true);
      }
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, [isGenerating, duration]);

  return (
    <div className="w-full">
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full bg-amber-500 transition-all duration-100",
            isBlinking && "animate-pulse"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-1 text-right text-xs text-gray-400">
        {progress.toFixed(0)}%
      </div>
    </div>
  );
} 