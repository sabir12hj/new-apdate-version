import { useEffect, useState } from "react";
import { useCountdown } from "@/hooks/useCountdown";
import { cn } from "@/lib/utils";

interface CountdownProps {
  targetDate: Date;
  className?: string;
  onComplete?: () => void;
  showSeconds?: boolean;
  size?: "sm" | "md" | "lg";
  type?: "normal" | "warning";
}

export function Countdown({
  targetDate,
  className,
  onComplete,
  showSeconds = true,
  size = "md",
  type = "normal",
}: CountdownProps) {
  const { timeLeft, isExpired } = useCountdown(targetDate);
  const [completed, setCompleted] = useState(false);
  
  useEffect(() => {
    if (isExpired && !completed) {
      setCompleted(true);
      onComplete?.();
    }
  }, [isExpired, completed, onComplete]);
  
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl"
  };
  
  const typeClasses = {
    normal: "text-gray-800",
    warning: "text-error"
  };

  return (
    <div
      className={cn(
        "font-accent font-bold",
        sizeClasses[size],
        typeClasses[type],
        className
      )}
    >
      {isExpired ? (
        "Expired"
      ) : (
        <>
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {String(timeLeft.hours).padStart(2, "0")}:
          {String(timeLeft.minutes).padStart(2, "0")}
          {showSeconds && `:${String(timeLeft.seconds).padStart(2, "0")}`}
        </>
      )}
    </div>
  );
}
