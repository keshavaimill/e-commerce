import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Camera,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Info,
  X,
  Download,
  RefreshCw,
  Zap,
  User,
  Shirt,
  ArrowRight,
  Activity,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { generateTryOn, checkHealth, type GenerateTryOnParams, type VtoHealthResponse } from "@/lib/vto-api";

export default function VirtualTryOn() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [category, setCategory] = useState<"tshirts" | "pants" | "jackets" | "shoes">("tshirts");
  const [currentBrand, setCurrentBrand] = useState<"Nike" | "Adidas" | "Zara">("Nike");
  const [currentSize, setCurrentSize] = useState("M");
  const [targetBrand, setTargetBrand] = useState<"Nike" | "Adidas" | "Zara">("Adidas");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mappedSize, setMappedSize] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // New state for recommendations and previews
  const [styleType, setStyleType] = useState<"casual" | "formal" | "sporty" | "ethnic">("casual");
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<string | null>(null);
  const [previewedOutfits, setPreviewedOutfits] = useState<Array<{ id: string; imageUrl: string; category: string; style: string }>>([]);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);

  // Health check query
  const { data: healthData, refetch: checkHealthStatus, isFetching: isHealthChecking, error: healthError } = useQuery<VtoHealthResponse>({
    queryKey: ["vto-health"],
    queryFn: checkHealth,
    enabled: false,
    retry: false,
  });

  // Handle health check success/error
  useEffect(() => {
    if (healthData) {
      toast({
        title: "Backend Online",
        description: `Gemini: ${healthData.gemini_enabled ? "Enabled" : "Disabled"}`,
      });
    }
  }, [healthData]);

  useEffect(() => {
    if (healthError) {
      toast({
        title: "Backend Offline",
        description: healthError instanceof Error ? healthError.message : "Connection failed",
        variant: "destructive",
      });
    }
  }, [healthError]);

  // Generate try-on mutation
  const generateMutation = useMutation({
    mutationFn: (params: GenerateTryOnParams) => generateTryOn(params),
    onSuccess: (data) => {
      const url = URL.createObjectURL(data.image);
      setGeneratedImageUrl(url);
      if (data.mappedSize) {
        setMappedSize(data.mappedSize);
      }
      toast({
        title: "Try-On Generated!",
        description: "Virtual try-on image generated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerate = () => {
    if (!currentSize.trim()) {
      toast({
        title: "Size required",
        description: "Please enter a size",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      gender,
      category,
      current_brand: currentBrand,
      current_size: currentSize,
      target_brand: targetBrand,
      user_image: uploadedImage ?? undefined,
    });
  };

  const handleHealthCheck = async () => {
    try {
      await checkHealthStatus();
    } catch (error) {
      // Error handled by query
    }
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const link = document.createElement("a");
    link.href = generatedImageUrl;
    link.download = `tryon-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Downloaded",
      description: "Image saved successfully",
    });
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (generatedImageUrl) {
        URL.revokeObjectURL(generatedImageUrl);
      }
    };
  }, [generatedImageUrl]);

  const isReady = currentSize.trim() && !generateMutation.isPending;
  const hasResult = !!generatedImageUrl && !generateMutation.isPending;

  // Mock recommendation data - in real app, this would come from API
  const mockRecommendations = useMemo(() => {
    const baseImages = [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=600&fit=crop",
    ];

    const categories = ["tshirts", "pants", "jackets", "shoes"] as const;
    const styles = ["casual", "formal", "sporty", "ethnic"] as const;
    
    return Array.from({ length: 12 }, (_, i) => ({
      id: `rec-${i + 1}`,
      imageUrl: baseImages[i % baseImages.length],
      category: categories[i % categories.length],
      style: styles[i % styles.length],
      name: `Outfit ${i + 1}`,
    }));
  }, []);

  // Filter recommendations based on category and style
  const filteredRecommendations = useMemo(() => {
    return mockRecommendations.filter(
      (rec) => rec.category === category && rec.style === styleType
    );
  }, [mockRecommendations, category, styleType]);

  // Get top 3 recommendations for the strip
  const topRecommendations = useMemo(() => {
    return filteredRecommendations.slice(0, 3);
  }, [filteredRecommendations]);

  // Handle recommendation click
  const handleRecommendationClick = (recId: string) => {
    const recommendation = mockRecommendations.find((r) => r.id === recId);
    if (!recommendation) return;

    setSelectedRecommendationId(recId);
    setActivePreviewId(recId);

    // Add to previewed outfits if not already there
    setPreviewedOutfits((prev) => {
      if (prev.some((o) => o.id === recId)) return prev;
      return [
        ...prev,
        {
          id: recId,
          imageUrl: recommendation.imageUrl,
          category: recommendation.category,
          style: recommendation.style,
        },
      ];
    });
  };

  // Handle thumbnail click
  const handleThumbnailClick = (outfitId: string) => {
    setActivePreviewId(outfitId);
    setSelectedRecommendationId(outfitId);
  };

  // Get active preview image
  const activePreviewImage = useMemo(() => {
    if (activePreviewId) {
      const outfit = previewedOutfits.find((o) => o.id === activePreviewId);
      if (outfit) return outfit.imageUrl;
    }
    if (generatedImageUrl) return generatedImageUrl;
    return null;
  }, [activePreviewId, previewedOutfits, generatedImageUrl]);

  // Update recommendations when category or style changes
  useEffect(() => {
    if (topRecommendations.length > 0) {
      const firstRec = topRecommendations[0];
      if (selectedRecommendationId !== firstRec.id) {
        handleRecommendationClick(firstRec.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, styleType]);

  // When a new try-on is generated, add it to previewed outfits
  useEffect(() => {
    if (generatedImageUrl && !previewedOutfits.some((o) => o.id === "generated")) {
      setPreviewedOutfits((prev) => [
        {
          id: "generated",
          imageUrl: generatedImageUrl,
          category,
          style: styleType,
        },
        ...prev,
      ]);
      setActivePreviewId("generated");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedImageUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="p-4 lg:p-8 space-y-8 max-w-[1920px] mx-auto">
        {/* Enhanced Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                  Virtual Try-On
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-ai/10 to-ai/5 text-ai border-ai/20 px-3 py-1.5">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                AI Powered
              </Badge>
              {healthData && (
                <Badge variant="outline" className="border-success/30 text-success bg-success/5">
                  <Activity className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Sidebar - Configuration (4 columns) */}
          <div className="xl:col-span-4 space-y-6">
            {/* Step 1: Identity Card */}
            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                  <span className="text-base font-bold text-primary-foreground">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Identity Setup</h3>
                  <p className="text-xs text-muted-foreground">Configure your profile</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2.5 block">
                    Gender
                  </label>
                  <Select value={gender} onValueChange={(v) => setGender(v as "male" | "female")}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2.5 block">
                    Profile Image
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="relative group">
                      <div className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-border shadow-md">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-3 right-3 h-9 w-9 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                        onClick={handleRemoveImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "aspect-[3/4] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
                        isDragging
                          ? "border-primary bg-primary/5 scale-[1.02]"
                          : "border-border/50 bg-muted/30 hover:border-primary/50 hover:bg-primary/5"
                      )}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="p-4 rounded-full bg-primary/10 mb-3">
                        <Upload className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">Click or drag to upload</p>
                      <p className="text-xs text-muted-foreground text-center px-4">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  )}
                  {!uploadedImage && (
                    <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg mt-3 border border-border/50">
                      <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Optional: Upload your photo or use default model image
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Step 2: Product Selection Card */}
            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                  <span className="text-base font-bold text-primary-foreground">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Product Selection</h3>
                  <p className="text-xs text-muted-foreground">Choose your product details</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2.5 block">
                      Category
                    </label>
                    <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tshirts">T-Shirts</SelectItem>
                        <SelectItem value="pants">Pants</SelectItem>
                        <SelectItem value="jackets">Jackets</SelectItem>
                        <SelectItem value="shoes">Shoes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2.5 block">
                      Gender
                    </label>
                    <Select value={gender} onValueChange={(v) => setGender(v as "male" | "female")}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium text-foreground mb-2.5 block flex items-center gap-2">
                    <Shirt className="w-4 h-4" />
                    Current Brand
                  </label>
                  <Select value={currentBrand} onValueChange={(v) => setCurrentBrand(v as typeof currentBrand)}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nike">Nike</SelectItem>
                      <SelectItem value="Adidas">Adidas</SelectItem>
                      <SelectItem value="Zara">Zara</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2.5 block">
                    Current Size
                  </label>
                  <Input
                    placeholder="e.g., M, 44, 8"
                    value={currentSize}
                    onChange={(e) => setCurrentSize(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2.5 block flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Target Brand
                  </label>
                  <Select value={targetBrand} onValueChange={(v) => setTargetBrand(v as typeof targetBrand)}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nike">Nike</SelectItem>
                      <SelectItem value="Adidas">Adidas</SelectItem>
                      <SelectItem value="Zara">Zara</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Mapped Size Display */}
                {mappedSize && (
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          Target Mapped Size
                        </div>
                        <div className="text-2xl font-bold text-primary">{mappedSize}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-primary/10">
                        <CheckCircle className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Health Check Card */}
            <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={handleHealthCheck}
                disabled={isHealthChecking}
              >
                {isHealthChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4 mr-2" />
                    Check Backend Health
                  </>
                )}
              </Button>
              {healthData && (
                <div className="mt-3 p-3 bg-success/10 rounded-lg border border-success/20">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <div className="font-medium text-success text-sm">Status: {healthData.status}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Gemini: {healthData.gemini_enabled ? "Enabled" : "Disabled"}
                  </div>
                </div>
              )}
              {healthError && (
                <div className="mt-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <div className="font-medium text-destructive text-sm">Backend Offline</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {healthError instanceof Error ? healthError.message : "Connection failed"}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Main Content Area - Preview & Results (8 columns) */}
          <div className="xl:col-span-8">
            <Card className="p-8 lg:p-10 border-border/50 bg-card/50 backdrop-blur-sm shadow-lg min-h-[600px] flex flex-col">
              {/* Top Recommendation Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                    Top Smart Recommendations
                  </h2>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">AI Generation</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Size {currentSize || "36"} recommendations available
                </p>
              </div>

              {/* Persistent Thumbnail Strip */}
              {previewedOutfits.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {previewedOutfits.map((outfit) => (
                      <button
                        key={outfit.id}
                        onClick={() => handleThumbnailClick(outfit.id)}
                        className={cn(
                          "relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300",
                          activePreviewId === outfit.id
                            ? "border-primary shadow-lg shadow-primary/20 scale-105"
                            : "border-border/50 hover:border-primary/50 hover:scale-[1.02]"
                        )}
                      >
                        <img
                          src={outfit.imageUrl}
                          alt="Previewed outfit"
                          className="w-full h-full object-cover"
                        />
                        {activePreviewId === outfit.id && (
                          <div className="absolute inset-0 bg-primary/20 border-2 border-primary rounded-lg" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendation Image Strip */}
              {topRecommendations.length > 0 && (
                <div className="mb-6">
                  <div className="grid grid-cols-3 gap-4">
                    {topRecommendations.map((rec) => (
                      <button
                        key={rec.id}
                        onClick={() => handleRecommendationClick(rec.id)}
                        className={cn(
                          "group relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all duration-300",
                          selectedRecommendationId === rec.id
                            ? "border-primary shadow-xl shadow-primary/30 scale-[1.02]"
                            : "border-border/50 hover:border-primary/50 hover:shadow-lg hover:scale-[1.01]"
                        )}
                      >
                        <img
                          src={rec.imageUrl}
                          alt={rec.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {selectedRecommendationId === rec.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Options / Filters Panel */}
              <div className="mb-6 p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Filter Options</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Clothing Category
                    </label>
                    <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tshirts">T-Shirts</SelectItem>
                        <SelectItem value="pants">Pants</SelectItem>
                        <SelectItem value="jackets">Jackets</SelectItem>
                        <SelectItem value="shoes">Shoes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Style Type
                    </label>
                    <Select value={styleType} onValueChange={(v) => setStyleType(v as typeof styleType)}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="sporty">Sporty</SelectItem>
                        <SelectItem value="ethnic">Ethnic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Header Section */}
              <div className="text-center space-y-3 mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                  Virtual Try-On Preview
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Generate a photorealistic virtual try-on using advanced AI technology
                </p>
              </div>

              {/* Generate Button */}
              <div className="flex justify-center mb-8">
                <Button
                  size="lg"
                  onClick={handleGenerate}
                  disabled={!isReady}
                  className={cn(
                    "min-w-[280px] h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300",
                    isReady && "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                  )}
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mr-2" />
                      Generate Virtual Try-On
                    </>
                  )}
                </Button>
              </div>

              {/* Loading State */}
              {generateMutation.isPending && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-12">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  </div>
                  <div className="text-center space-y-2 max-w-sm">
                    <p className="text-lg font-semibold text-foreground">Processing Your Request</p>
                    <p className="text-sm text-muted-foreground">
                      Our AI is creating your virtual try-on. This may take 10-30 seconds.
                    </p>
                    <div className="pt-4 w-full max-w-xs mx-auto">
                      <Progress value={undefined} className="h-2" />
                    </div>
                  </div>
                </div>
              )}

              {/* Main Preview Display - Interactive */}
              {(activePreviewImage || hasResult) && (
                <div className="flex-1 space-y-6 animate-fade-in">
                  {hasResult && activePreviewId === "generated" && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-success/10 rounded-lg border border-success/20">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span className="font-semibold text-success">Try-On Generated Successfully!</span>
                    </div>
                  )}
                  <div className="relative group rounded-2xl overflow-hidden border-2 border-border bg-muted/20 shadow-2xl transition-all duration-500">
                    <img
                      key={activePreviewId || "default"}
                      src={activePreviewImage || generatedImageUrl || ""}
                      alt="Virtual Try-On Preview"
                      className="w-full h-auto transition-opacity duration-500 group-hover:scale-[1.02]"
                      style={{
                        transition: "opacity 0.3s ease-in-out, transform 0.5s ease-in-out",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {activePreviewId === "generated" 
                          ? "Final Result from Gemini 3" 
                          : selectedRecommendationId 
                          ? `Preview: ${mockRecommendations.find(r => r.id === selectedRecommendationId)?.name || "Outfit"}`
                          : "Virtual Try-On Preview"}
                      </p>
                      {mappedSize && activePreviewId === "generated" && (
                        <p className="text-xs text-muted-foreground">
                          Mapped size: <span className="font-semibold text-primary">{mappedSize}</span>
                        </p>
                      )}
                    </div>
                    {hasResult && activePreviewId === "generated" && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownload}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRegenerate}
                          className="gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Regenerate
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Generated Image Display - Fallback for when no preview is active */}
              {hasResult && !activePreviewImage && (
                <div className="flex-1 space-y-6 animate-fade-in">
                  <div className="flex items-center justify-center gap-2 p-3 bg-success/10 rounded-lg border border-success/20">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span className="font-semibold text-success">Try-On Generated Successfully!</span>
                  </div>
                  <div className="relative group rounded-2xl overflow-hidden border-2 border-border bg-muted/20 shadow-2xl">
                    <img
                      src={generatedImageUrl || ""}
                      alt="Generated Try-On"
                      className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">Final Result from Gemini 3</p>
                      {mappedSize && (
                        <p className="text-xs text-muted-foreground">
                          Mapped size: <span className="font-semibold text-primary">{mappedSize}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerate}
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State - Only show if no recommendations are available */}
              {!hasResult && !generateMutation.isPending && !activePreviewImage && topRecommendations.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-16">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border-2 border-primary/20">
                      <Camera className="w-16 h-16 text-primary/60" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <div className="text-center space-y-2 max-w-md">
                    <p className="text-xl font-semibold text-foreground">Ready to Generate</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Configure your settings on the left and click generate to create your virtual try-on experience
                    </p>
                  </div>
                </div>
              )}

              {/* Empty State - When recommendations exist but none selected */}
              {!hasResult && !generateMutation.isPending && !activePreviewImage && topRecommendations.length > 0 && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-16">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border-2 border-primary/20">
                      <Camera className="w-16 h-16 text-primary/60" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <div className="text-center space-y-2 max-w-md">
                    <p className="text-xl font-semibold text-foreground">Select a Recommendation</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Click on any recommendation above to preview, or generate a new virtual try-on
                    </p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {generateMutation.isError && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-full max-w-md p-6 bg-destructive/10 border-2 border-destructive/20 rounded-xl space-y-4">
                    <div className="flex items-center gap-3 text-destructive">
                      <div className="p-2 rounded-lg bg-destructive/20">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Generation Failed</div>
                        <div className="text-sm text-destructive/80">
                          {generateMutation.error instanceof Error
                            ? generateMutation.error.message
                            : "Unknown error occurred"}
                        </div>
                      </div>
                    </div>
                    {generateMutation.error instanceof Error &&
                     generateMutation.error.message.includes("Could not connect") && (
                      <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-2">
                        <p className="text-sm font-medium text-foreground">Backend Setup Required:</p>
                        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                          <li>Navigate to the VTryon_Updated directory</li>
                          <li>Install dependencies: <code className="bg-muted px-1 rounded">pip install -r requirements.txt</code></li>
                          <li>Set your GEMINI_API_KEY in a .env file</li>
                          <li>Run the server: <code className="bg-muted px-1 rounded">uvicorn app:app --reload</code></li>
                        </ol>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleGenerate}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
