import { useState } from "react";
import { 
  MessageSquare, 
  Sparkles, 
  Clock, 
  ArrowRight,
  Table,
  BarChart3,
  Download,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const exampleQueries = [
  "Show mismatched SKUs for Amazon.in last 2 days",
  "Which listings failed Takealot compliance?",
  "How much photoshoot cost saved in India this month?",
  "Generate Flipkart-ready content for this image",
  "List SKUs with missing localized content in South Africa"
];

const recentQueries = [
  { query: "Show top 10 SKUs by revenue at risk", time: "5 min ago" },
  { query: "Which categories have highest mismatch rate?", time: "12 min ago" },
  { query: "List all pending translations for Hindi", time: "1 hr ago" },
];

const mockResults = [
  { sku: 'SKU-8742', marketplace: 'Amazon.in', issue: 'Color Mismatch', risk: '₹45,000' },
  { sku: 'SKU-3291', marketplace: 'Flipkart', issue: 'Missing Translation', risk: '₹32,000' },
  { sku: 'SKU-1056', marketplace: 'Takealot', issue: 'Low Resolution', risk: 'R 28,000' },
  { sku: 'SKU-7823', marketplace: 'Amazon.in', issue: 'Attribute Error', risk: '₹18,000' },
  { sku: 'SKU-4521', marketplace: 'eBay', issue: 'Size Mismatch', risk: '$2,100' },
];

export default function SQLAgent() {
  const [query, setQuery] = useState('');
  const [hasResult, setHasResult] = useState(false);

  const handleSubmit = () => {
    if (query.trim()) {
      setHasResult(true);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Text-to-SQL Agent
          </h1>
          <Badge className="bg-ai/10 text-ai border-ai/20">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
        </div>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Ask questions about your content data in natural language. Get instant insights without writing SQL.
        </p>
      </div>

      {/* Query Input */}
      <div className="glass-card rounded-2xl p-6 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
        <div className="relative">
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl border border-border/50 focus-within:border-primary/50 transition-colors">
            <MessageSquare className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about your content data..."
              className="flex-1 bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground min-h-[60px]"
              rows={2}
            />
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Market:</span>
              <Badge variant="outline">India 🇮🇳</Badge>
            </div>
            <Button 
              onClick={handleSubmit}
              className="gap-2"
              disabled={!query.trim()}
            >
              <Sparkles className="w-4 h-4" />
              Run Query
            </Button>
          </div>
        </div>

        {/* Example Queries */}
        <div className="mt-6 pt-4 border-t border-border/30">
          <p className="text-sm text-muted-foreground mb-3">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((eq) => (
              <button
                key={eq}
                onClick={() => setQuery(eq)}
                className="px-3 py-1.5 text-sm bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors"
              >
                {eq}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Results */}
        <div className="lg:col-span-2">
          {hasResult ? (
            <div className="glass-card rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">Query Results</span>
                  <Badge variant="secondary">5 rows</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="gap-1"
                    onClick={() => toast({
                      title: "Visualizing",
                      description: "Generating chart visualization...",
                    })}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Visualize
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="gap-1"
                    onClick={() => toast({
                      title: "Exporting",
                      description: "Preparing data export...",
                    })}
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">SKU</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Marketplace</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Issue</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Revenue at Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockResults.map((row, i) => (
                      <tr key={i} className="border-t border-border/30">
                        <td className="p-3">
                          <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
                            {row.sku}
                          </code>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{row.marketplace}</Badge>
                        </td>
                        <td className="p-3 text-sm text-foreground">{row.issue}</td>
                        <td className="p-3 text-sm font-medium text-destructive">{row.risk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-muted/20 border-t border-border/30">
                <p className="text-xs text-muted-foreground">
                  Generated SQL: <code className="bg-muted px-1 rounded">SELECT sku, marketplace, issue_type, revenue_at_risk FROM content_issues WHERE market = 'india' ORDER BY revenue_at_risk DESC LIMIT 5</code>
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-xl p-12 text-center opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Ask a Question</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Type a question about your content data in natural language and our AI will generate the insights for you.
              </p>
            </div>
          )}
        </div>

        {/* Recent Queries */}
        <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-medium text-foreground">Recent Queries</h3>
          </div>

          <div className="space-y-3">
            {recentQueries.map((rq, i) => (
              <button
                key={i}
                onClick={() => setQuery(rq.query)}
                className="w-full text-left p-3 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors group"
              >
                <p className="text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {rq.query}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{rq.time}</p>
              </button>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border/30">
            <h4 className="text-sm font-medium text-foreground mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start gap-2"
                onClick={() => toast({
                  title: "Generating report",
                  description: "Creating daily mismatch report...",
                })}
              >
                <BarChart3 className="w-4 h-4" />
                Daily Mismatch Report
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start gap-2"
                onClick={() => toast({
                  title: "Exporting",
                  description: "Exporting all issues...",
                })}
              >
                <Table className="w-4 h-4" />
                Export All Issues
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
