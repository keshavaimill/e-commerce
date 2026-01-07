import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  delay?: number;
  isFromBackend?: boolean;
}

export function KPICard({ 
  title, 
  value, 
  change, 
  changeLabel = "vs last period",
  icon: Icon,
  iconColor = "text-primary",
  delay = 0,
  isFromBackend = false
}: KPICardProps) {
  const isPositive = change >= 0;
  
  return (
    <div 
      className={cn(
        "glass-card rounded-xl p-5 hover-lift cursor-default",
        "opacity-0 animate-fade-in"
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          "bg-primary/10"
        )}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
          isPositive 
            ? "bg-success/10 text-success" 
            : "bg-destructive/10 text-destructive"
        )}>
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-bold text-foreground">{value}</h3>
          {isFromBackend ? (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-success/20 text-success border-success/30">
              API
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground border-muted">
              Demo
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground/70">{changeLabel}</p>
      </div>
    </div>
  );
}
