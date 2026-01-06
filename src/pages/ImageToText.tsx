import { useState, useRef } from "react";
import { 
  FileText, 
  Languages, 
  Target, 
  Zap, 
  Clock,
  Upload,
  Copy,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
  { label: "Language Completeness", value: "87%", icon: Languages, change: 12 },
  { label: "Marketplace Readiness", value: "94/100", icon: Target, change: 5 },
  { label: "SEO Quality Score", value: "91/100", icon: Zap, change: 8 },
  { label: "Attribute Accuracy", value: "96%", icon: CheckCircle, change: 3 },
  { label: "Time Saved/Listing", value: "4.2min", icon: Clock, change: -22 },
];

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧', status: 'complete' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', status: 'complete' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳', status: 'pending' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳', status: 'pending' },
  { code: 'bn', name: 'Bengali', flag: '🇮🇳', status: 'complete' },
  { code: 'zu', name: 'Zulu', flag: '🇿🇦', status: 'complete' },
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦', status: 'error' },
  { code: 'xh', name: 'Xhosa', flag: '🇿🇦', status: 'complete' },
  { code: 'es', name: 'Spanish', flag: '🌍', status: 'complete' },
  { code: 'fr', name: 'French', flag: '🌍', status: 'complete' },
  { code: 'ar', name: 'Arabic', flag: '🌍', status: 'pending' },
];

const attributes = [
  { name: 'Color', value: 'Navy Blue', confidence: 98 },
  { name: 'Material', value: 'Cotton Blend', confidence: 92 },
  { name: 'Gender', value: 'Unisex', confidence: 88 },
  { name: 'Size Range', value: 'S-XXL', confidence: 95 },
  { name: 'Pattern', value: 'Solid', confidence: 99 },
  { name: 'Fit Type', value: 'Regular', confidence: 85 },
  { name: 'Occasion', value: 'Casual', confidence: 78 },
  { name: 'Care', value: 'Machine Wash', confidence: 91 },
];

export default function ImageToText() {
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [region, setRegion] = useState('india');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleBrowse = () => {
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

  const handleGenerate = () => {
    if (!uploadedImage) {
      toast({
        title: "Upload image",
        description: "Please upload a product image first",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Generating description",
      description: "AI is analyzing your image...",
    });
  };

  const handleApproveAll = () => {
    toast({
      title: "Approved",
      description: "All translations have been approved",
    });
  };

  const handleEditSelected = () => {
    toast({
      title: "Edit mode",
      description: "Select translations to edit",
    });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Image-to-Text Auto Generation
          </h1>
          <Badge className="bg-ai/10 text-ai border-ai/20">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Generate marketplace-ready product descriptions from images with multi-language support
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
        {/* AI Description Builder */}
        <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <h3 className="text-lg font-semibold text-foreground mb-4">AI Description Builder</h3>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Image Upload */}
          <div 
            className="aspect-video bg-gradient-to-br from-sand-50 to-sand-100 rounded-xl mb-4 flex items-center justify-center border-2 border-dashed border-border relative overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={!uploadedImage ? handleBrowse : undefined}
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
                <Upload className="w-10 h-10 text-sand-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Upload product image</p>
                <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={handleBrowse}>
                  Browse
                </Button>
              </div>
            )}
          </div>

          <Button className="w-full gap-2 mb-6" size="lg" onClick={handleGenerate}>
            <Sparkles className="w-4 h-4" />
            Generate Description
          </Button>

          {/* Generated Content */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Title</label>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 gap-1 text-xs"
                  onClick={() => handleCopy("Premium Cotton Blend Unisex T-Shirt - Navy Blue | Comfortable Casual Wear", "Title")}
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </Button>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-sm text-foreground">
                Premium Cotton Blend Unisex T-Shirt - Navy Blue | Comfortable Casual Wear
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Short Description</label>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 gap-1 text-xs"
                  onClick={() => handleCopy("Elevate your everyday style with this premium cotton blend t-shirt. Features a classic fit, breathable fabric, and versatile navy blue color perfect for any casual occasion.", "Short description")}
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </Button>
              </div>
              <Textarea 
                className="min-h-[80px] resize-none bg-muted/50"
                defaultValue="Elevate your everyday style with this premium cotton blend t-shirt. Features a classic fit, breathable fabric, and versatile navy blue color perfect for any casual occasion."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Bullet Points</label>
              </div>
              <ul className="space-y-2">
                {[
                  'Premium cotton-polyester blend for ultimate comfort',
                  'Classic unisex fit suitable for all body types',
                  'Easy care - machine washable',
                  'Available in sizes S to XXL',
                  'Perfect for casual and semi-formal occasions'
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Language Tabs */}
            <div className="pt-4 border-t border-border/30">
              <label className="text-sm font-medium text-foreground mb-3 block">
                Translations
              </label>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setActiveLanguage(lang.code)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                      activeLanguage === lang.code
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                    {lang.status === 'complete' && (
                      <CheckCircle className="w-3 h-3 text-success" />
                    )}
                    {lang.status === 'error' && (
                      <AlertTriangle className="w-3 h-3 text-destructive" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Attribute Confidence Matrix */}
        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Attribute Confidence Matrix</h3>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="india">🇮🇳 India</SelectItem>
                  <SelectItem value="south_africa">🇿🇦 South Africa</SelectItem>
                  <SelectItem value="global">🌍 Global</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              {attributes.map((attr) => (
                <div 
                  key={attr.name}
                  className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{attr.name}</div>
                    <div className="text-sm text-muted-foreground">{attr.value}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          attr.confidence >= 90 ? "bg-success" :
                          attr.confidence >= 80 ? "bg-warning" : "bg-destructive"
                        )}
                        style={{ width: `${attr.confidence}%` }}
                      />
                    </div>
                    <span className={cn(
                      "text-sm font-medium w-10 text-right",
                      attr.confidence >= 90 ? "text-success" :
                      attr.confidence >= 80 ? "text-warning" : "text-destructive"
                    )}>
                      {attr.confidence}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Localization QA */}
          <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
            <h3 className="text-lg font-semibold text-foreground mb-4">Localization Quality Check</h3>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {languages.map((lang) => (
                <div 
                  key={lang.code}
                  className="p-4 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span className="font-medium text-foreground">{lang.name}</span>
                    </div>
                    <Badge 
                      variant={lang.status === 'complete' ? 'default' : 'secondary'}
                      className={cn(
                        lang.status === 'complete' && "bg-success/10 text-success",
                        lang.status === 'pending' && "bg-warning/10 text-warning",
                        lang.status === 'error' && "bg-destructive/10 text-destructive"
                      )}
                    >
                      {lang.status === 'complete' && 'Complete'}
                      {lang.status === 'pending' && 'Pending'}
                      {lang.status === 'error' && 'Issues Found'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Grammar</span>
                      <CheckCircle className="w-4 h-4 text-success" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Keywords</span>
                      <span className="text-success font-medium">94%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Cultural</span>
                      <span className="text-success font-medium">100%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Forbidden</span>
                      <CheckCircle className="w-4 h-4 text-success" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <Button className="flex-1" onClick={handleApproveAll}>Approve All</Button>
              <Button variant="outline" className="flex-1" onClick={handleEditSelected}>Edit Selected</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
