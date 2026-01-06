import { useState, useRef } from "react";
import { 
  Camera, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  Users,
  Upload,
  Download,
  RefreshCw,
  ArrowRight,
  Sparkles,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const kpis = [
  { label: "Photos Generated Today", value: "1,847", icon: Camera, change: 12 },
  { label: "Avg Rendering Time", value: "4.2s", icon: Clock, change: -18 },
  { label: "Cost Saved Today", value: "₹2.8L", icon: DollarSign, change: 24 },
  { label: "Approval Rate", value: "94%", icon: CheckCircle, change: 3 },
  { label: "Diversity Score", value: "87/100", icon: Users, change: 5 },
];

const templates = {
  indian: [
    { id: 1, name: "Saree Elegance", uses: 4521, image: "Traditional saree pose" },
    { id: 2, name: "Kurta Classic", uses: 3892, image: "Modern kurta style" },
    { id: 3, name: "Festival Vibes", uses: 2847, image: "Festive background" },
    { id: 4, name: "Ethnic Fusion", uses: 2156, image: "Indo-western blend" },
  ],
  southAfrican: [
    { id: 5, name: "Ubuntu Spirit", uses: 1892, image: "Multi-ethnic models" },
    { id: 6, name: "Safari Chic", uses: 1567, image: "Outdoor lifestyle" },
    { id: 7, name: "Modern Afro", uses: 1234, image: "Contemporary African" },
    { id: 8, name: "Cape Town Cool", uses: 987, image: "Urban backdrop" },
  ],
  global: [
    { id: 9, name: "Studio Pro", uses: 8934, image: "White background" },
    { id: 10, name: "Urban Edge", uses: 6721, image: "City lifestyle" },
    { id: 11, name: "Minimalist", uses: 5432, image: "Clean aesthetic" },
    { id: 12, name: "High Fashion", uses: 4123, image: "Runway style" },
  ]
};

export default function AIPhotoshoot() {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [activeRegion, setActiveRegion] = useState("indian");
  const [selectedSkinTone, setSelectedSkinTone] = useState<string | null>(null);
  const [selectedMarketplace, setSelectedMarketplace] = useState<Set<string>>(new Set());
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setUploadedFileName(file.name);
        toast({
          title: "Image uploaded",
          description: `Successfully uploaded ${file.name}`,
        });
      };
      reader.onerror = () => {
        toast({
          title: "Upload error",
          description: "Failed to read the image file",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setUploadedFileName(file.name);
        toast({
          title: "Image uploaded",
          description: `Successfully uploaded ${file.name}`,
        });
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: "Invalid file",
        description: "Please drop an image file",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setUploadedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "Image removed",
      description: "Upload a new image to continue",
    });
  };

  const handleGeneratePhotoshoot = () => {
    if (!uploadedImage) {
      toast({
        title: "Upload image",
        description: "Please upload a product image first",
        variant: "destructive",
      });
      return;
    }
    if (!selectedTemplate) {
      toast({
        title: "Select template",
        description: "Please select a template style first",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Generating photoshoot",
      description: "AI is creating your product photoshoot...",
    });
  };

  const handleRegenerate = () => {
    if (!uploadedImage) {
      toast({
        title: "Upload image",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Regenerating",
      description: "Creating a new variation...",
    });
  };

  const handleDownload = () => {
    if (!uploadedImage) {
      toast({
        title: "No image to download",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }
    // Create a download link
    const link = document.createElement('a');
    link.href = uploadedImage;
    link.download = uploadedFileName || 'photoshoot-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Downloading",
      description: "Image download started",
    });
  };

  const toggleMarketplace = (mp: string) => {
    const newSet = new Set(selectedMarketplace);
    if (newSet.has(mp)) {
      newSet.delete(mp);
    } else {
      newSet.add(mp);
    }
    setSelectedMarketplace(newSet);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            AI Model Photoshoot Generator
          </h1>
          <Badge className="bg-ai/10 text-ai border-ai/20">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Generate professional product imagery with AI models for every marketplace
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={kpi.label}
              className="glass-card rounded-xl p-4 opacity-0 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground">{kpi.value}</span>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs",
                    kpi.change > 0 ? "text-success" : "text-destructive"
                  )}
                >
                  {kpi.change > 0 ? '+' : ''}{kpi.change}%
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Selector */}
        <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <h3 className="text-lg font-semibold text-foreground mb-4">Model Style Selection</h3>
          
          <Tabs value={activeRegion} onValueChange={setActiveRegion}>
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="indian">🇮🇳 Indian</TabsTrigger>
              <TabsTrigger value="southAfrican">🇿🇦 South African</TabsTrigger>
              <TabsTrigger value="global">🌍 Global</TabsTrigger>
            </TabsList>

            {Object.entries(templates).map(([region, items]) => (
              <TabsContent key={region} value={region} className="mt-0">
                <div className="grid grid-cols-2 gap-3">
                  {items.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={cn(
                        "p-4 rounded-xl border-2 cursor-pointer transition-all",
                        "hover:border-primary/50 hover:bg-muted/50",
                        selectedTemplate === template.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border/50"
                      )}
                    >
                      <div className="aspect-square bg-gradient-to-br from-sand-100 to-sand-200 rounded-lg mb-3 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-sand-400" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium text-foreground text-sm">{template.name}</h4>
                        <p className="text-xs text-muted-foreground">{template.image}</p>
                        <Badge variant="secondary" className="text-xs">
                          {template.uses.toLocaleString()} uses
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Skin Tone Selector */}
          <div className="mt-6 pt-4 border-t border-border/30">
            <h4 className="text-sm font-medium text-foreground mb-3">Skin Tone</h4>
            <div className="flex gap-2">
              {['#f5d0c5', '#e8b89a', '#d4a574', '#c68642', '#8d5524', '#5c3c24'].map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedSkinTone(color)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-colors",
                    selectedSkinTone === color 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-border hover:border-primary"
                  )}
                  style={{ backgroundColor: color }}
                  title={`Skin tone ${color}`}
                />
              ))}
            </div>
            {selectedSkinTone && (
              <p className="text-xs text-muted-foreground mt-2">Selected skin tone</p>
            )}
          </div>
        </div>

        {/* Before/After Viewer */}
        <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
          <h3 className="text-lg font-semibold text-foreground mb-4">Image Preview</h3>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div 
            className="aspect-[4/3] bg-gradient-to-br from-sand-50 to-sand-100 rounded-xl mb-4 flex items-center justify-center border-2 border-dashed border-border relative overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={!uploadedImage ? handleBrowseFiles : undefined}
          >
            {uploadedImage ? (
              <div className="relative w-full h-full group">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded product" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {uploadedFileName && (
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-black/70 text-white text-xs px-2 py-1 rounded truncate">
                      {uploadedFileName}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-12 h-12 text-sand-400 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Upload product image</p>
                <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={handleBrowseFiles}>
                  Browse Files
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Original</span>
              <ArrowRight className="w-4 h-4" />
              <span className="text-foreground font-medium">AI Generated</span>
            </div>
            <Button size="sm" variant="ghost" className="gap-1" onClick={handleRegenerate}>
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </Button>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1 gap-2" onClick={handleGeneratePhotoshoot}>
              <Sparkles className="w-4 h-4" />
              Generate Photoshoot
            </Button>
            <Button variant="outline" size="icon" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {/* Export Options */}
          <div className="mt-4 pt-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground mb-2">Export for:</p>
            <div className="flex flex-wrap gap-2">
              {['Amazon', 'Flipkart', 'Takealot', 'eBay', 'Shopify'].map((mp) => (
                <Badge 
                  key={mp} 
                  variant={selectedMarketplace.has(mp) ? "default" : "outline"} 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => toggleMarketplace(mp)}
                >
                  {mp}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cost Efficiency Panel */}
      <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
        <h3 className="text-lg font-semibold text-foreground mb-4">Cost & Efficiency Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-success/5 rounded-xl">
            <h4 className="text-sm font-medium text-foreground mb-2">Cost Savings by Region</h4>
            <div className="space-y-3">
              {[
                { region: 'India', saved: '₹12.5L', percent: 78 },
                { region: 'South Africa', saved: 'R 892K', percent: 65 },
                { region: 'Global', saved: '$45K', percent: 82 }
              ].map((item) => (
                <div key={item.region}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{item.region}</span>
                    <span className="font-medium text-foreground">{item.saved}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-success rounded-full"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-info/5 rounded-xl">
            <h4 className="text-sm font-medium text-foreground mb-2">Time to Publish</h4>
            <div className="flex items-end gap-4 h-32">
              <div className="flex-1 flex flex-col items-center">
                <div className="flex-1 w-full bg-muted rounded-t-lg relative">
                  <div 
                    className="absolute bottom-0 w-full bg-muted-foreground/30 rounded-t-lg"
                    style={{ height: '80%' }}
                  />
                </div>
                <span className="text-xs text-muted-foreground mt-2">Before</span>
                <span className="text-sm font-medium">48 hrs</span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="flex-1 w-full bg-muted rounded-t-lg relative">
                  <div 
                    className="absolute bottom-0 w-full bg-info rounded-t-lg"
                    style={{ height: '25%' }}
                  />
                </div>
                <span className="text-xs text-muted-foreground mt-2">After AI</span>
                <span className="text-sm font-medium text-info">12 hrs</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-xl">
            <h4 className="text-sm font-medium text-foreground mb-2">Category Breakdown</h4>
            <div className="space-y-2">
              {[
                { cat: 'Fashion', percent: 45, color: 'bg-sand-500' },
                { cat: 'Beauty', percent: 25, color: 'bg-sand-400' },
                { cat: 'Home', percent: 20, color: 'bg-sand-300' },
                { cat: 'Other', percent: 10, color: 'bg-sand-200' }
              ].map((item) => (
                <div key={item.cat} className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded", item.color)} />
                  <span className="text-sm text-muted-foreground flex-1">{item.cat}</span>
                  <span className="text-sm font-medium">{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
