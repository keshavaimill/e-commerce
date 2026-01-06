import { Settings as SettingsIcon, User, Bell, Shield, Globe, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[800px] mx-auto">
      <div className="space-y-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and platform preferences</p>
      </div>

      <div className="space-y-4">
        {[
          { icon: User, title: "Profile", description: "Manage your account details", badge: null },
          { icon: Bell, title: "Notifications", description: "Configure alert preferences", badge: "3 new" },
          { icon: Shield, title: "Security", description: "Password and authentication", badge: null },
          { icon: Globe, title: "Marketplaces", description: "Connected marketplace accounts", badge: "5 active" },
          { icon: Palette, title: "Appearance", description: "Theme and display settings", badge: null },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="glass-card rounded-xl p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              {item.badge && (
                <Badge variant="secondary">{item.badge}</Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
