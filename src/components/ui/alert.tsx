import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/utils/utils"
import { X } from "lucide-react"
import { useEffect, useState } from "react"

interface AlertProps extends VariantProps<typeof alertVariants> {
  message?: string
  autoClose?: boolean
  onClose?: () => void
  className?: string
}

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
        success:
          "text-green-500 bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-green-500/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  autoClose = false,
  message,
  onClose,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants> & AlertProps) {
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && onClose) {
      // Start progress bar animation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(progressInterval);
            return 0;
          }
          return prev - 1; // Decrease by 1% every 100ms
        });
      }, 100);

      // Close alert after 10 seconds
      const closeTimer = setTimeout(() => {
        setIsVisible(false);
        // Wait for animation to complete before calling onClose
        setTimeout(() => {
          onClose();
        }, 300); // Match transition duration
      }, 10000);

      return () => {
        clearInterval(progressInterval);
        clearTimeout(closeTimer);
      };
    }
  }, [autoClose, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        alertVariants({ variant }), 
        "flex flex-col items-start justify-between relative overflow-hidden transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between w-full">
        {message && <AlertDescription>{message}</AlertDescription>}
        {onClose && (
          <X 
            className="cursor-pointer w-6 h-6 hover:bg-gray-200 rounded-full p-0.5 flex-shrink-0 ml-2" 
            onClick={handleClose} 
          />
        )}
      </div>
      
      {/* Progress Bar */}
      {autoClose && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/20">
          <div 
            className="h-full bg-current/30 transition-all duration-100 ease-linear"
            style={{ 
              width: `${progress}%`,
              transition: 'width 100ms linear'
            }}
          />
        </div>
      )}
    </div>
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm leading-relaxed flex-1",
        className
      )}
      {...props}
    />
  )
}

export { Alert }
