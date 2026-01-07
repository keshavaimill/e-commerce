import { useQuery } from "@tanstack/react-query";
import { 
  ImageOff,
  Camera,
  ShieldCheck,
  Languages,
  Cpu,
  AlertTriangle,
} from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { QualityRiskRadar } from "@/components/dashboard/QualityRiskRadar";
import { PhotoshootPerformance } from "@/components/dashboard/PhotoshootPerformance";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { ImpactMetrics } from "@/components/dashboard/ImpactMetrics";
import { apiClient } from "@/lib/api";

type DashboardKpiIconName =
  | "ImageOff"
  | "Camera"
  | "ShieldCheck"
  | "Languages"
  | "Cpu"
  | "AlertTriangle";

interface DashboardKpiDto {
  title: string;
  value: string;
  change: number;
  icon: DashboardKpiIconName;
  iconColor: string;
}

interface DashboardKpisResponse {
  kpis: DashboardKpiDto[];
}

const iconMap: Record<DashboardKpiIconName, typeof ImageOff> = {
  ImageOff,
  Camera,
  ShieldCheck,
  Languages,
  Cpu,
  AlertTriangle,
};

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery<DashboardKpisResponse>({
    queryKey: ["dashboard", "kpis"],
    queryFn: () => apiClient.get<DashboardKpisResponse>("/dashboard/kpis"),
  });

  const kpis = data?.kpis ?? [];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Hero Section */}
      <div className="space-y-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          AI E-Commerce Content Intelligence – Global Command Center
        </h1>
        <p className="text-muted-foreground">
          Real-time content accuracy • AI imagery • Marketplace compliance • Localization engine
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {isLoading && !kpis.length && (
          <>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="glass-card rounded-xl p-5 animate-pulse space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-muted" />
                  <div className="h-5 w-16 rounded-full bg-muted" />
                </div>
                <div className="h-6 w-20 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            ))}
          </>
        )}
        {!isLoading &&
          !isError &&
          kpis.map((kpi, index) => (
            <KPICard
              key={kpi.title}
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              icon={iconMap[kpi.icon]}
              iconColor={kpi.iconColor}
              delay={index * 50}
              isFromBackend={!!data}
            />
          ))}
        {isError && (
          <>
            {/* Show dummy data when API fails */}
            {[
              { title: "Image-Description Mismatch", value: "3.2%", change: -12, icon: ImageOff, iconColor: "text-destructive" },
              { title: "AI Photoshoot Savings", value: "₹18.5L", change: 28, icon: Camera, iconColor: "text-success" },
              { title: "Compliance Score", value: "94/100", change: 5, icon: ShieldCheck, iconColor: "text-primary" },
              { title: "Localization Complete", value: "87%", change: 15, icon: Languages, iconColor: "text-info" },
              { title: "SKU AI-Coverage", value: "92%", change: 8, icon: Cpu, iconColor: "text-ai" },
              { title: "Revenue at Risk", value: "₹2.3Cr", change: -22, icon: AlertTriangle, iconColor: "text-warning" },
            ].map((kpi, index) => (
              <KPICard
                key={kpi.title}
                title={kpi.title}
                value={kpi.value}
                change={kpi.change}
                icon={kpi.icon}
                iconColor={kpi.iconColor}
                delay={index * 50}
                isFromBackend={false}
              />
            ))}
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QualityRiskRadar />
        <PhotoshootPerformance />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertsList />
        <ImpactMetrics />
      </div>
    </div>
  );
}
