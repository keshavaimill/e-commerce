import { 
  ImageOff, 
  Camera, 
  ShieldCheck, 
  Languages, 
  Cpu, 
  AlertTriangle 
} from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { QualityRiskRadar } from "@/components/dashboard/QualityRiskRadar";
import { PhotoshootPerformance } from "@/components/dashboard/PhotoshootPerformance";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { ImpactMetrics } from "@/components/dashboard/ImpactMetrics";

const kpis = [
  {
    title: "Image-Description Mismatch",
    value: "3.2%",
    change: -12,
    icon: ImageOff,
    iconColor: "text-destructive"
  },
  {
    title: "AI Photoshoot Savings",
    value: "₹18.5L",
    change: 28,
    icon: Camera,
    iconColor: "text-success"
  },
  {
    title: "Compliance Score",
    value: "94/100",
    change: 5,
    icon: ShieldCheck,
    iconColor: "text-primary"
  },
  {
    title: "Localization Complete",
    value: "87%",
    change: 15,
    icon: Languages,
    iconColor: "text-info"
  },
  {
    title: "SKU AI-Coverage",
    value: "92%",
    change: 8,
    icon: Cpu,
    iconColor: "text-ai"
  },
  {
    title: "Revenue at Risk",
    value: "₹2.3Cr",
    change: -22,
    icon: AlertTriangle,
    iconColor: "text-warning"
  },
];

export default function Dashboard() {
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
        {kpis.map((kpi, index) => (
          <KPICard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            icon={kpi.icon}
            iconColor={kpi.iconColor}
            delay={index * 50}
          />
        ))}
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
