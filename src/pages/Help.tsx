import { HelpCircle, Book, MessageCircle, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Help() {
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[800px] mx-auto">
      <div className="space-y-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Help & Support</h1>
        <p className="text-muted-foreground">Get help with the Content Intelligence Platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { 
            icon: Book, 
            title: "Documentation", 
            description: "Read our comprehensive guides",
            action: "Browse Docs"
          },
          { 
            icon: MessageCircle, 
            title: "Live Chat", 
            description: "Chat with our support team",
            action: "Start Chat"
          },
          { 
            icon: Mail, 
            title: "Email Support", 
            description: "Get help via email",
            action: "Send Email"
          },
          { 
            icon: HelpCircle, 
            title: "FAQs", 
            description: "Frequently asked questions",
            action: "View FAQs"
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="glass-card rounded-xl p-6 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
              <Button variant="outline" size="sm" className="gap-1">
                {item.action}
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
