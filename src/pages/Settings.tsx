import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Bell, Shield, Globe, Palette, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface UserSettings {
  profile: {
    name: string;
    email: string;
    avatar?: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    alerts: string[];
  };
  marketplaces: Array<{
    id: string;
    name: string;
    active: boolean;
    connected: boolean;
  }>;
  appearance: {
    theme: "system" | "light" | "dark";
  };
}

export default function Settings() {
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading, error } = useQuery<UserSettings>({
    queryKey: ["settings"],
    queryFn: () => apiClient.get<UserSettings>("/settings"),
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      return apiClient.put<{ success: boolean; message: string }>("/settings", updates);
    },
    onSuccess: (data) => {
      toast({
        title: "Settings updated",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const settings = settingsData;
  const activeMarketplaces = settings?.marketplaces?.filter(m => m.active && m.connected).length ?? 0;
  const newNotifications = 3; // This would come from a notifications API

  const settingsItems = [
    { 
      icon: User, 
      title: "Profile", 
      description: "Manage your account details", 
      badge: null,
      onClick: () => {
        // Handle profile edit
      }
    },
    { 
      icon: Bell, 
      title: "Notifications", 
      description: "Configure alert preferences", 
      badge: newNotifications > 0 ? `${newNotifications} new` : null,
      onClick: () => {
        updateMutation.mutate({
          notifications: {
            ...settings?.notifications,
            email: !settings?.notifications?.email,
          },
        });
      }
    },
    { 
      icon: Shield, 
      title: "Security", 
      description: "Password and authentication", 
      badge: null,
      onClick: () => {
        // Handle security settings
      }
    },
    { 
      icon: Globe, 
      title: "Marketplaces", 
      description: "Connected marketplace accounts", 
      badge: activeMarketplaces > 0 ? `${activeMarketplaces} active` : null,
      onClick: () => {
        // Handle marketplace settings
      }
    },
    { 
      icon: Palette, 
      title: "Appearance", 
      description: "Theme and display settings", 
      badge: null,
      onClick: () => {
        const currentTheme = settings?.appearance?.theme || "system";
        const nextTheme = currentTheme === "system" ? "light" : currentTheme === "light" ? "dark" : "system";
        updateMutation.mutate({
          appearance: {
            theme: nextTheme,
          },
        });
      }
    },
  ];

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-[800px] mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-[800px] mx-auto">
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-destructive">Failed to load settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[800px] mx-auto">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Settings</h1>
          {settingsData ? (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-success/20 text-success border-success/30">
              API
            </Badge>
          ) : error ? (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground border-muted">
              Demo
            </Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground">Manage your account and platform preferences</p>
      </div>

      <div className="space-y-4">
        {settingsItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="glass-card rounded-xl p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={item.onClick}
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
              {updateMutation.isPending && item.title === "Notifications" && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
