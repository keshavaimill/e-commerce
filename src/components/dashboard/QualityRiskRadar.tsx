import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

type IssueType = "Image Mismatch" | "Attribute Error" | "Low Resolution" | "Missing Keywords";

interface QualityRiskRadarResponse {
  riskData: Record<string, Record<IssueType, number>>;
  categories: string[];
  issueTypes: IssueType[];
}

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

  const { data, isLoading, isError } = useQuery<QualityRiskRadarResponse>({
    queryKey: ["dashboard", "quality-risk-radar", selectedMarketplace],
    queryFn: () =>
      apiClient.get<QualityRiskRadarResponse>(
        `/dashboard/quality-risk-radar?marketplace=${encodeURIComponent(selectedMarketplace)}`,
      ),
  });

  // Fallback dummy data
  const dummyCategories = ["Fashion", "Beauty", "Electronics", "Home", "Grocery"];
  const dummyIssueTypes: IssueType[] = ["Image Mismatch", "Attribute Error", "Low Resolution", "Missing Keywords"];
  const dummyRiskData: Record<string, Record<IssueType, number>> = {
    "Fashion": { "Image Mismatch": 85, "Attribute Error": 45, "Low Resolution": 20, "Missing Keywords": 60 },
    "Beauty": { "Image Mismatch": 30, "Attribute Error": 70, "Low Resolution": 15, "Missing Keywords": 40 },
    "Electronics": { "Image Mismatch": 15, "Attribute Error": 25, "Low Resolution": 80, "Missing Keywords": 35 },
    "Home": { "Image Mismatch": 50, "Attribute Error": 55, "Low Resolution": 30, "Missing Keywords": 75 },
    "Grocery": { "Image Mismatch": 25, "Attribute Error": 40, "Low Resolution": 10, "Missing Keywords": 90 },
  };

  const categories = data?.categories.length ? data.categories : dummyCategories;
  const issueTypes = data?.issueTypes.length ? data.issueTypes : dummyIssueTypes;
  const riskData = data?.riskData && Object.keys(data.riskData).length > 0 ? data.riskData : dummyRiskData;
  const isUsingDummy = isError || (!data && !isLoading);

  return (
    <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">Content Quality Risk Radar</h3>
            {data ? (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-success/20 text-success border-success/30">
                API
              </Badge>
            ) : isError ? (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground border-muted">
                Demo
              </Badge>
            ) : null}
          </div>
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
              <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">
                Category
              </th>
              {issueTypes.length === 0 && isLoading && (
                <>
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <th
                      key={idx}
                      className="text-center text-xs font-medium text-muted-foreground pb-3 px-2 min-w-[100px]"
                    >
                      &nbsp;
                    </th>
                  ))}
                </>
              )}
              {issueTypes.map((type) => (
                <th
                  key={type}
                  className="text-center text-xs font-medium text-muted-foreground pb-3 px-2 min-w-[100px]"
                >
                  {type}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && categories.length === 0 && (
              <>
                {Array.from({ length: 5 }).map((_, rowIdx) => (
                  <tr key={rowIdx} className="border-t border-border/30">
                    <td className="py-3 pr-4">
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    </td>
                    {Array.from({ length: 4 }).map((_, colIdx) => (
                      <td key={colIdx} className="py-3 px-2">
                        <div className="h-10 rounded-lg bg-muted animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            )}
            {categories.map((category) => (
              <tr key={category} className="border-t border-border/30">
                <td className="py-3 pr-4">
                  <span className="text-sm font-medium text-foreground">{category}</span>
                </td>
                {issueTypes.map((type) => {
                  const value = riskData[category]?.[type] ?? 0;
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
