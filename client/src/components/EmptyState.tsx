import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`empty-state animate-fade-in ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground text-balance">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-md text-balance leading-relaxed">
            {description}
          </p>
        </div>
        {actionLabel && onAction && (
          <Button 
            onClick={onAction}
            className="btn-hover mt-4"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}