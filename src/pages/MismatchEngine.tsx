import { useState } from "react";
import { 
  Filter, 
  Download, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ChevronDown,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const kpis = [
  { label: "Mismatch Rate", value: "3.2%", change: -12, status: "success" },
  { label: "Attribute Errors", value: "1,247", change: 8, status: "warning" },
  { label: "Localization Coverage", value: "87%", change: 15, status: "success" },
  { label: "Rejection Rate", value: "2.1%", change: -5, status: "success" },
  { label: "Revenue at Risk", value: "₹2.3Cr", change: -22, status: "warning" },
];

const tableData = [
  {
    sku: "SKU-8742",
    marketplace: "Amazon.in",
    mismatchScore: 85,
    attributeErrors: ["Color", "Size"],
    localMissing: ["hi", "ta"],
    category: "Fashion",
    issueType: "Color Mismatch",
    listingProb: 45,
    impactScore: 4.5
  },
  {
    sku: "SKU-3291",
    marketplace: "Flipkart",
    mismatchScore: 42,
    attributeErrors: ["Material"],
    localMissing: ["hi"],
    category: "Home",
    issueType: "Attribute Error",
    listingProb: 72,
    impactScore: 3.2
  },
  {
    sku: "SKU-1056",
    marketplace: "Takealot",
    mismatchScore: 95,
    attributeErrors: ["Color", "Pattern", "Size"],
    localMissing: ["zu", "af"],
    category: "Fashion",
    issueType: "Multiple Issues",
    listingProb: 15,
    impactScore: 4.9
  },
  {
    sku: "SKU-7823",
    marketplace: "Amazon.in",
    mismatchScore: 28,
    attributeErrors: [],
    localMissing: ["ta"],
    category: "Electronics",
    issueType: "Localization",
    listingProb: 88,
    impactScore: 2.1
  },
  {
    sku: "SKU-4521",
    marketplace: "eBay",
    mismatchScore: 67,
    attributeErrors: ["Size", "Dimensions"],
    localMissing: [],
    category: "Home",
    issueType: "Size Mismatch",
    listingProb: 55,
    impactScore: 3.8
  },
];

const flagEmojis: Record<string, string> = {
  hi: "🇮🇳",
  ta: "🇮🇳",
  te: "🇮🇳",
  bn: "🇮🇳",
  zu: "🇿🇦",
  af: "🇿🇦",
  xh: "🇿🇦",
  en: "🌍",
  es: "🌍",
  fr: "🌍",
  ar: "🌍"
};

export default function MismatchEngine() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [marketplace, setMarketplace] = useState("all");
  const [language, setLanguage] = useState("all");
  const [region, setRegion] = useState("all");
  const [issueType, setIssueType] = useState("all");
  const [selectedSku, setSelectedSku] = useState<string | null>(null);

  const handleClearFilters = () => {
    setSearchQuery("");
    setCategory("all");
    setBrand("all");
    setMarketplace("all");
    setLanguage("all");
    setRegion("all");
    setIssueType("all");
    toast({
      title: "Filters cleared",
      description: "All filters have been reset.",
    });
  };

  const handleMoreFilters = () => {
    toast({
      title: "More filters",
      description: "Additional filter options coming soon.",
    });
  };

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Preparing data export...",
    });
  };

  const handleViewDetails = (sku: string) => {
    setSelectedSku(sku);
    toast({
      title: "View details",
      description: `Viewing details for ${sku}`,
    });
  };

  const handleFix = (sku: string) => {
    toast({
      title: "Fix issue",
      description: `Starting fix process for ${sku}`,
    });
  };

  // Filter the table data based on current filter values
  const filteredData = tableData.filter((row) => {
    // Search query filter
    if (searchQuery && !row.sku.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Category filter (case-insensitive)
    if (category !== "all" && row.category.toLowerCase() !== category.toLowerCase()) {
      return false;
    }

    // Marketplace filter
    if (marketplace !== "all") {
      const marketplaceMap: Record<string, string> = {
        "amazon": "Amazon.in",
        "amazon-com": "Amazon.com",
        "flipkart": "Flipkart",
        "myntra": "Myntra",
        "takealot": "Takealot",
        "checkers": "Checkers",
        "woolworths": "Woolworths",
        "makro": "Makro",
        "shopify": "Shopify",
        "magento": "Magento",
        "woocommerce": "WooCommerce",
        "ebay": "eBay",
        "walmart": "Walmart"
      };
      if (row.marketplace !== marketplaceMap[marketplace]) {
        return false;
      }
    }

    // Issue Type filter
    if (issueType !== "all") {
      const issueTypeMap: Record<string, string> = {
        "color": "Color Mismatch",
        "size": "Size Mismatch",
        "local": "Localization"
      };
      // Check if issue type matches or contains the filter value
      const expectedType = issueTypeMap[issueType];
      if (expectedType && !row.issueType.includes(expectedType.split(" ")[0])) {
        return false;
      }
    }

    // Language filter (show items where this language is missing)
    if (language !== "all") {
      if (!row.localMissing.includes(language)) {
        return false;
      }
    }

    // Region filter (based on marketplace)
    if (region !== "all") {
      const indiaMarketplaces = ["Amazon.in", "Flipkart", "Myntra"];
      const southAfricaMarketplaces = ["Takealot", "Checkers", "Woolworths", "Makro"];
      const globalMarketplaces = ["Amazon.com", "eBay", "Shopify", "Magento", "WooCommerce", "Walmart"];
      
      if (region === "india" && !indiaMarketplaces.includes(row.marketplace)) {
        return false;
      }
      if (region === "south_africa" && !southAfricaMarketplaces.includes(row.marketplace)) {
        return false;
      }
      if (region === "global" && !globalMarketplaces.includes(row.marketplace)) {
        return false;
      }
    }

    // Brand filter (not in data yet, but keeping for future)
    // if (brand !== "all") {
    //   // Implement when brand data is available
    // }

    return true;
  });

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Image-Description Mismatch Engine
        </h1>
        <p className="text-muted-foreground">
          Detect and resolve content quality issues across marketplaces
        </p>
      </div>

      {/* Filters Bar */}
      <div className="glass-card rounded-xl p-4 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search SKUs..." 
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[140px] bg-muted/50">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="fashion">Fashion</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="home">Home</SelectItem>
              <SelectItem value="beauty">Beauty</SelectItem>
              <SelectItem value="grocery">Grocery</SelectItem>
            </SelectContent>
          </Select>

          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger className="w-[140px] bg-muted/50">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              <SelectItem value="brand1">Brand A</SelectItem>
              <SelectItem value="brand2">Brand B</SelectItem>
              <SelectItem value="brand3">Brand C</SelectItem>
            </SelectContent>
          </Select>

          <Select value={marketplace} onValueChange={setMarketplace}>
            <SelectTrigger className="w-[140px] bg-muted/50">
              <SelectValue placeholder="Marketplace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Markets</SelectItem>
              <SelectItem value="amazon">Amazon.in</SelectItem>
              <SelectItem value="amazon-com">Amazon.com</SelectItem>
              <SelectItem value="flipkart">Flipkart</SelectItem>
              <SelectItem value="myntra">Myntra</SelectItem>
              <SelectItem value="takealot">Takealot</SelectItem>
              <SelectItem value="checkers">Checkers</SelectItem>
              <SelectItem value="woolworths">Woolworths</SelectItem>
              <SelectItem value="makro">Makro</SelectItem>
              <SelectItem value="shopify">Shopify</SelectItem>
              <SelectItem value="magento">Magento</SelectItem>
              <SelectItem value="woocommerce">WooCommerce</SelectItem>
              <SelectItem value="ebay">eBay</SelectItem>
              <SelectItem value="walmart">Walmart</SelectItem>
            </SelectContent>
          </Select>

          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[140px] bg-muted/50">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">Hindi</SelectItem>
              <SelectItem value="ta">Tamil</SelectItem>
              <SelectItem value="te">Telugu</SelectItem>
              <SelectItem value="bn">Bengali</SelectItem>
              <SelectItem value="zu">Zulu</SelectItem>
              <SelectItem value="af">Afrikaans</SelectItem>
              <SelectItem value="xh">Xhosa</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="ar">Arabic</SelectItem>
            </SelectContent>
          </Select>

          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-[140px] bg-muted/50">
              <SelectValue placeholder="Country/Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="india">India</SelectItem>
              <SelectItem value="south_africa">South Africa</SelectItem>
              <SelectItem value="global">Global</SelectItem>
            </SelectContent>
          </Select>

          <Select value={issueType} onValueChange={setIssueType}>
            <SelectTrigger className="w-[140px] bg-muted/50">
              <SelectValue placeholder="Issue Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Issues</SelectItem>
              <SelectItem value="color">Color Mismatch</SelectItem>
              <SelectItem value="size">Size Mismatch</SelectItem>
              <SelectItem value="local">Localization</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="gap-2" onClick={handleMoreFilters}>
            <Filter className="w-4 h-4" />
            More Filters
          </Button>

          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleClearFilters}>
            Clear all
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi, index) => (
          <div 
            key={kpi.label}
            className="glass-card rounded-xl p-4 opacity-0 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs",
                  kpi.change < 0 ? "text-success" : "text-warning"
                )}
              >
                {kpi.change > 0 ? '+' : ''}{kpi.change}%
              </Badge>
            </div>
            <div className="text-xl font-bold text-foreground">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Table */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Image-Description Audit Table</h3>
                <p className="text-sm text-muted-foreground">
                  Showing {filteredData.length} of {tableData.length} items with issues
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">SKU</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Marketplace</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Mismatch Score</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Attribute Errors</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Local Missing</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Category</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Issue Type</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Listing %</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Impact</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.map((row, index) => (
                      <tr 
                        key={row.sku}
                        className="border-t border-border/30 hover:bg-muted/20 transition-colors"
                      >
                      <td className="p-4">
                        <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
                          {row.sku}
                        </code>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{row.marketplace}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full",
                                row.mismatchScore >= 70 ? "bg-destructive" :
                                row.mismatchScore >= 40 ? "bg-warning" : "bg-success"
                              )}
                              style={{ width: `${row.mismatchScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{row.mismatchScore}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {row.attributeErrors.length > 0 ? (
                            row.attributeErrors.map(err => (
                              <Badge key={err} variant="secondary" className="text-xs bg-destructive/10 text-destructive">
                                {err}
                              </Badge>
                            ))
                          ) : (
                            <CheckCircle className="w-4 h-4 text-success" />
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {row.localMissing.length > 0 ? (
                            row.localMissing.map(lang => (
                              <span key={lang} title={lang}>
                                {flagEmojis[lang]}
                              </span>
                            ))
                          ) : (
                            <CheckCircle className="w-4 h-4 text-success" />
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-foreground">{row.category}</td>
                      <td className="p-4">
                        <Badge 
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            row.issueType === "Multiple Issues" && "bg-destructive/10 text-destructive"
                          )}
                        >
                          {row.issueType}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "text-sm font-medium",
                          row.listingProb >= 70 ? "text-success" :
                          row.listingProb >= 40 ? "text-warning" : "text-destructive"
                        )}>
                          {row.listingProb}%
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span 
                              key={i}
                              className={cn(
                                "text-xs",
                                i < Math.floor(row.impactScore) ? "text-warning" : "text-muted"
                              )}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0" 
                            onClick={() => handleViewDetails(row.sku)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="default" 
                            className="h-8 text-xs"
                            onClick={() => handleFix(row.sku)}
                          >
                            Fix
                          </Button>
                        </div>
                      </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <AlertTriangle className="w-8 h-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No items found matching your filters</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleClearFilters}
                            className="mt-2"
                          >
                            Clear filters
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Panels */}
        <div className="space-y-6">
          {/* Panel A: Attribute Mismatch Visualizer */}
          <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            <h3 className="text-lg font-semibold text-foreground mb-4">Attribute Mismatch Visualizer</h3>
            <p className="text-xs text-muted-foreground mb-4">Side-by-side comparison of AI-detected vs Marketplace attributes</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="font-medium text-muted-foreground">AI-Detected</div>
                <div className="font-medium text-muted-foreground">Marketplace Listing</div>
              </div>
              
              {/* Color */}
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Color</div>
                    <div className="text-sm font-medium text-foreground">Navy Blue</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Color</div>
                    <div className="text-sm font-medium text-destructive">Black</div>
                    <XCircle className="w-3 h-3 text-destructive mt-1" />
                  </div>
                </div>
              </div>

              {/* Size */}
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Size</div>
                    <div className="text-sm font-medium text-foreground">M</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Size</div>
                    <div className="text-sm font-medium text-destructive">L</div>
                    <XCircle className="w-3 h-3 text-destructive mt-1" />
                  </div>
                </div>
              </div>

              {/* Pattern */}
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Pattern</div>
                    <div className="text-sm font-medium text-foreground">Solid</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Pattern</div>
                    <div className="text-sm font-medium text-foreground">Solid</div>
                    <CheckCircle className="w-3 h-3 text-success mt-1" />
                  </div>
                </div>
              </div>

              {/* Gender */}
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Gender</div>
                    <div className="text-sm font-medium text-foreground">Unisex</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Gender</div>
                    <div className="text-sm font-medium text-foreground">Unisex</div>
                    <CheckCircle className="w-3 h-3 text-success mt-1" />
                  </div>
                </div>
              </div>

              {/* Material */}
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Material</div>
                    <div className="text-sm font-medium text-foreground">Cotton Blend</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Material</div>
                    <div className="text-sm font-medium text-foreground">Cotton Blend</div>
                    <CheckCircle className="w-3 h-3 text-success mt-1" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/30">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2"
                onClick={() => toast({
                  title: "View comparison",
                  description: "Opening full attribute comparison...",
                })}
              >
                <Eye className="w-4 h-4" />
                View Full Comparison
              </Button>
            </div>
          </div>

          {/* Panel B: Localization Panel */}
          <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
            <h3 className="text-lg font-semibold text-foreground mb-4">Localization Panel</h3>
            
            <div className="space-y-4">
              {/* India Languages */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <span>🇮🇳</span> India
                </div>
                <div className="flex flex-wrap gap-2">
                  {['en', 'hi', 'ta', 'te', 'bn'].map((lang) => {
                    const langNames: Record<string, string> = {
                      en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', bn: 'Bengali'
                    };
                    const isMissing = tableData[0]?.localMissing?.includes(lang);
                    return (
                      <Badge
                        key={lang}
                        variant={isMissing ? "destructive" : "default"}
                        className={cn(
                          "text-xs",
                          isMissing && "bg-destructive/10 text-destructive"
                        )}
                      >
                        {langNames[lang]}
                        {isMissing && <XCircle className="w-3 h-3 ml-1" />}
                        {!isMissing && <CheckCircle className="w-3 h-3 ml-1 text-success" />}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* South Africa Languages */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <span>🇿🇦</span> South Africa
                </div>
                <div className="flex flex-wrap gap-2">
                  {['en', 'zu', 'af', 'xh'].map((lang) => {
                    const langNames: Record<string, string> = {
                      en: 'English', zu: 'Zulu', af: 'Afrikaans', xh: 'Xhosa'
                    };
                    const isMissing = tableData[2]?.localMissing?.includes(lang);
                    return (
                      <Badge
                        key={lang}
                        variant={isMissing ? "destructive" : "default"}
                        className={cn(
                          "text-xs",
                          isMissing && "bg-destructive/10 text-destructive"
                        )}
                      >
                        {langNames[lang]}
                        {isMissing && <XCircle className="w-3 h-3 ml-1" />}
                        {!isMissing && <CheckCircle className="w-3 h-3 ml-1 text-success" />}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Global Languages */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <span>🌍</span> Global
                </div>
                <div className="flex flex-wrap gap-2">
                  {['en', 'es', 'fr', 'ar'].map((lang) => {
                    const langNames: Record<string, string> = {
                      en: 'English', es: 'Spanish', fr: 'French', ar: 'Arabic'
                    };
                    return (
                      <Badge
                        key={lang}
                        variant="default"
                        className="text-xs"
                      >
                        {langNames[lang]}
                        <CheckCircle className="w-3 h-3 ml-1 text-success" />
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Missing Translations</span>
                <Badge variant="destructive" className="text-xs">3</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Incorrect Translations</span>
                <Badge variant="secondary" className="text-xs bg-warning/10 text-warning">0</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Non-compliant Keywords</span>
                <Badge variant="secondary" className="text-xs bg-success/10 text-success">0</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
