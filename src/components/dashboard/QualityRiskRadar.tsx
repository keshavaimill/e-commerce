import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const categories = ["Fashion", "Beauty", "Electronics", "Home", "Grocery"];
const issueTypes = ["Image Mismatch", "Attribute Error", "Low Resolution", "Missing Keywords"];

const riskData: Record<string, Record<string, number>> = {
  "Fashion": { "Image Mismatch": 85, "Attribute Error": 45, "Low Resolution": 20, "Missing Keywords": 60 },
  "Beauty": { "Image Mismatch": 30, "Attribute Error": 70, "Low Resolution": 15, "Missing Keywords": 40 },
  "Electronics": { "Image Mismatch": 15, "Attribute Error": 25, "Low Resolution": 80, "Missing Keywords": 35 },
  "Home": { "Image Mismatch": 50, "Attribute Error": 55, "Low Resolution": 30, "Missing Keywords": 75 },
  "Grocery": { "Image Mismatch": 25, "Attribute Error": 40, "Low Resolution": 10, "Missing Keywords": 90 },
};

function getRiskColor(value: number) {
  if (value >= 70) return "bg-destructive/80 text-destructive-foreground";
  if (value >= 40) return "bg-warning/80 text-warning-foreground";
  return "bg-success/80 text-success-foreground";
}

function getRiskBg(value: number) {
  if (value >= 70) return "bg-destructive/10";
  if (value >= 40) return "bg-warning/10";
  return "bg-success/10";
}

export function QualityRiskRadar() {
  const [selectedMarketplace, setSelectedMarketplace] = useState("Amazon.in");

  return (
    <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Content Quality Risk Radar</h3>
          <p className="text-sm text-muted-foreground">Issue distribution by category</p>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-success/80" />
            <span className="text-muted-foreground">Low (&lt;40%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-warning/80" />
            <span className="text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-destructive/80" />
            <span className="text-muted-foreground">High (&gt;70%)</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Category</th>
              {issueTypes.map((type) => (
                <th key={type} className="text-center text-xs font-medium text-muted-foreground pb-3 px-2 min-w-[100px]">
                  {type}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((category, idx) => (
              <tr key={category} className="border-t border-border/30">
                <td className="py-3 pr-4">
                  <span className="text-sm font-medium text-foreground">{category}</span>
                </td>
                {issueTypes.map((type) => {
                  const value = riskData[category][type];
                  return (
                    <td key={type} className="py-3 px-2">
                      <div className={cn(
                        "flex items-center justify-center h-10 rounded-lg text-sm font-medium transition-all hover:scale-105",
                        getRiskBg(value)
                      )}>
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-semibold",
                          getRiskColor(value)
                        )}>
                          {value}%
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-border/30 flex gap-2">
        {["Amazon.in", "Flipkart", "Takealot"].map((mp) => (
          <button
            key={mp}
            onClick={() => {
              setSelectedMarketplace(mp);
              toast({
                title: "Marketplace changed",
                description: `Viewing data for ${mp}`,
              });
            }}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
              selectedMarketplace === mp
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {mp}
          </button>
        ))}
      </div>
    </div>
  );
}
