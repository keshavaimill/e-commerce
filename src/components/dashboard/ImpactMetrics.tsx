import { Clock, DollarSign, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const metrics = [
  {
    icon: Clock,
    value: "2,847",
    unit: "hrs",
    label: "Time Saved",
    description: "This month",
    gradient: "from-sand-400/20 to-sand-500/20"
  },
  {
    icon: DollarSign,
    value: "₹18.5L",
    unit: "",
    label: "Cost Avoided",
    description: "Photography expenses",
    gradient: "from-success/10 to-success/20"
  },
  {
    icon: Zap,
    value: "+47%",
    unit: "",
    label: "SKU Throughput",
    description: "vs manual process",
    gradient: "from-warning/10 to-warning/20"
  },
  {
    icon: ShieldCheck,
    value: "89%",
    unit: "",
    label: "Error Reduction",
    description: "Listing rejections",
    gradient: "from-info/10 to-info/20"
  }
];

export function ImpactMetrics() {
  return (
    <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">AI Business Impact</h3>
        <p className="text-sm text-muted-foreground">Measurable outcomes from automation</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div 
              key={metric.label}
              className={cn(
                "p-4 rounded-xl bg-gradient-to-br transition-all hover:scale-[1.02]",
                "opacity-0 animate-scale-in",
                metric.gradient
              )}
              style={{ animationDelay: `${600 + index * 100}ms`, animationFillMode: 'forwards' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-card/80 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-foreground" />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">{metric.value}</span>
                  {metric.unit && (
                    <span className="text-sm text-muted-foreground">{metric.unit}</span>
                  )}
                </div>
                <div className="text-sm font-medium text-foreground">{metric.label}</div>
                <div className="text-xs text-muted-foreground">{metric.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border/30">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">ROI This Quarter</span>
          <span className="font-bold text-success">+312%</span>
        </div>
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-sand-500 to-sand-600 rounded-full transition-all duration-1000"
            style={{ width: '78%' }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">78% of annual target achieved</p>
      </div>
    </div>
  );
}
