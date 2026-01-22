import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  X,
  Loader2,
  LucideIcon,
  BarChart3,
  Info,
  AlertCircle,
  Activity,
  Zap,
  User,
  Shirt,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import {
  getGarmentOptions,
  generateTryOn,
  getSupportedSizes,
  base64ToBlobUrl,
  type GetGarmentOptionsParams,
  type GenerateTryOnParams,
  type GarmentOption,
  type GetGarmentOptionsResponse,
  type GetSupportedSizesParams,
  type VtoApiError
} from "@/lib/vto-api";
import {
  getPhotoshootTemplates,
  generatePhotoshoot,
  generatePhotoshootStream,
  base64ToBlobUrl as photoshootBase64ToBlobUrl,
  type PhotoshootTemplatesResponse as BackendPhotoshootTemplatesResponse,
  type PhotoshootTemplate as BackendPhotoshootTemplate,
  PhotoshootApiError
} from "@/lib/photoshoot-api";

// Note: checkHealth and VtoHealthResponse removed as backend doesn't have /health endpoint
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface PhotoshootKPI {
  label: string;
  value: string;
  icon: string;
  change: number;
}

interface PhotoshootTemplate {
  id: string | number;
  name: string;
  uses: number | string;
  image: string;
  previewUrl?: string;
}

interface PhotoshootTemplatesResponse {
  indian: PhotoshootTemplate[];
  southAfrican: PhotoshootTemplate[];
  global: PhotoshootTemplate[];
}

// State for generated images (3 views)
interface GeneratedView {
  view: "Front" | "Side" | "Angle";
  imageUrl: string;
}


interface CostAnalysisResponse {
  regionSavings: Array<{
    region: string;
    saved: string;
    amount: number;
    percent: number;
  }>;
  timeToPublish: {
    before: number;
    after: number;
    unit: string;
  };
  categoryBreakdown: Array<{
    cat: string;
    percent: number;
    color: string;
  }>;
}

const iconMap: Record<string, LucideIcon> = {
  Camera,
  Clock,
  DollarSign,
  CheckCircle,
  Users,
};

const mockTemplates = {
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
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<"indian" | "southAfrican" | "global">("indian");
  const [selectedSkinTone, setSelectedSkinTone] = useState<string>("Wheatish");
  const [selectedMarketplace, setSelectedMarketplace] = useState<Set<string>>(new Set());
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generatedViews, setGeneratedViews] = useState<GeneratedView[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Virtual Try-On states
  const vtoFileInputRef = useRef<HTMLInputElement>(null);
  const [vtoGender, setVtoGender] = useState<"male" | "female">("male");
  const [vtoCategory, setVtoCategory] = useState<"tshirts" | "pants" | "jackets" | "shoes">("tshirts");
  const [vtoCurrentBrand, setVtoCurrentBrand] = useState<"Nike" | "Adidas" | "Zara">("Nike");
  const [vtoCurrentSize, setVtoCurrentSize] = useState("M");
  const [vtoTargetBrand, setVtoTargetBrand] = useState<"Nike" | "Adidas" | "Zara">("Adidas");
  const [vtoUploadedImage, setVtoUploadedImage] = useState<File | null>(null);
  const [vtoImagePreview, setVtoImagePreview] = useState<string | null>(null);
  const [vtoMappedSize, setVtoMappedSize] = useState<string | null>(null);
  const [vtoGeneratedImageUrl, setVtoGeneratedImageUrl] = useState<string | null>(null);
  const [vtoIsDragging, setVtoIsDragging] = useState(false);

  // Backend integration state (replacing mock recommendations)
  const [vtoGarmentOptions, setVtoGarmentOptions] = useState<GarmentOption[]>([]);
  const [vtoSelectedGarmentPath, setVtoSelectedGarmentPath] = useState<string | null>(null);
  const [vtoGarmentImageUrls, setVtoGarmentImageUrls] = useState<Map<string, string>>(new Map());
  const [vtoPreviewedOutfits, setVtoPreviewedOutfits] = useState<Array<{ id: string; imageUrl: string; garmentPath?: string }>>([]);
  const [vtoActivePreviewId, setVtoActivePreviewId] = useState<string | null>(null);

  // State management for VTO flow (matching Streamlit behavior)
  type VtoState = "idle" | "loading_options" | "options_loaded" | "generating" | "completed" | "error";
  const [vtoState, setVtoState] = useState<VtoState>("idle");
  const [vtoError, setVtoError] = useState<string | null>(null);
  const [vtoSupportedSizes, setVtoSupportedSizes] = useState<string[]>([]);
  const [focusedImage, setFocusedImage] = useState<{ imageUrl: string; id: string } | null>(null);

  // Fetch KPIs - Optimized for fast loading
  const { data: kpisData, isLoading: kpisLoading } = useQuery<{ kpis: PhotoshootKPI[] }>({
    queryKey: ["photoshoot", "kpis"],
    queryFn: () => apiClient.get<{ kpis: PhotoshootKPI[] }>("/photoshoot/kpis"),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (formerly cacheTime)
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // Wait 1 second before retry
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  // Fetch templates from real backend
  const { data: backendTemplatesData, isLoading: templatesLoading, error: templatesError } = useQuery<BackendPhotoshootTemplatesResponse>({
    queryKey: ["photoshoot", "templates"],
    queryFn: () => getPhotoshootTemplates(),
    retry: 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Transform backend templates to frontend format
  const templatesData = useMemo<PhotoshootTemplatesResponse | null>(() => {
    if (!backendTemplatesData) return null;

    // Map region names: backend uses "Indian", "South African", "Global"
    const regionMap: Record<string, keyof BackendPhotoshootTemplatesResponse> = {
      indian: "Indian",
      southAfrican: "South African",
      global: "Global",
    };

    const transformTemplate = (template: BackendPhotoshootTemplate): PhotoshootTemplate => ({
      id: template.id,
      name: template.name,
      uses: parseInt(template.uses.replace(/[^\d]/g, "")) || 0,
      image: template.img,
      previewUrl: template.img,
    });

    return {
      indian: (backendTemplatesData.Indian || []).map(transformTemplate),
      southAfrican: (backendTemplatesData["South African"] || []).map(transformTemplate),
      global: (backendTemplatesData.Global || []).map(transformTemplate),
    };
  }, [backendTemplatesData]);

  // Fetch cost analysis - Optimized for fast loading
  const { data: costAnalysisData, isLoading: costAnalysisLoading } = useQuery<CostAnalysisResponse>({
    queryKey: ["photoshoot", "cost-analysis"],
    queryFn: () => apiClient.get<CostAnalysisResponse>("/photoshoot/cost-analysis?period=month"),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (formerly cacheTime)
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // Wait 1 second before retry
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  // Fetch supported sizes dynamically (matching Streamlit behavior)
  const { data: supportedSizesData } = useQuery({
    queryKey: ["vto-supported-sizes", vtoCategory, vtoGender, vtoCurrentBrand],
    queryFn: async () => {
      return getSupportedSizes({
        category: vtoCategory,
        gender: vtoGender,
        brand: vtoCurrentBrand,
      });
    },
    enabled: !!vtoCategory && !!vtoGender && !!vtoCurrentBrand,
    staleTime: 60000, // Cache for 1 minute
  });

  // Update supported sizes when data changes
  useEffect(() => {
    if (supportedSizesData?.sizes) {
      setVtoSupportedSizes(supportedSizesData.sizes);
      // Auto-select first size if current size is not in the list
      if (!supportedSizesData.sizes.includes(vtoCurrentSize)) {
        setVtoCurrentSize(supportedSizesData.sizes[0] || "M");
      }
    }
  }, [supportedSizesData, vtoCurrentSize]);

  // Generate photoshoot mutation (using real backend with streaming support)
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!uploadedFile || !selectedTemplate) {
        throw new Error("Please upload an image and select a template");
      }

      // Map frontend region to backend region name
      const regionMap: Record<string, string> = {
        indian: "Indian",
        southAfrican: "South African",
        global: "Global",
      };

      const backendRegion = regionMap[activeRegion] || "Global";

      // Clear previous views and set generating state
      setGeneratedViews([]);
      setIsGenerating(true);

      try {
        // Use streaming API to show images as they're generated
        await generatePhotoshootStream(
          {
            template_id: selectedTemplate,
            region: backendRegion,
            skin_tone: selectedSkinTone || "Wheatish",
            cloth_image: uploadedFile,
          },
          (view) => {
            console.log("📸 Received view:", view.view, "Image URL length:", view.imageUrl?.length);

            // Use React.startTransition for non-urgent updates, but this is urgent so we update immediately
            // Immediately update state - optimized for fastest rendering
            setGeneratedViews((prev) => {
              // Fast path: check if view already exists
              const existingIndex = prev.findIndex((v) => v.view === view.view);

              if (existingIndex >= 0) {
                // Update existing view in place (faster than map)
                const updated = [...prev];
                updated[existingIndex] = view;
                console.log("🔄 Updated existing view:", view.view);
                return updated;
              } else {
                // Add new view - append to array
                console.log("➕ Added new view:", view.view, "Total:", prev.length + 1);
                return [...prev, view];
              }
            });

            // Force a re-render by updating a counter (if needed)
            // But React should handle this automatically with state update

            // Show toast for first image (Front view) - with shorter duration
            if (view.view === "Front") {
              toast({
                title: "First view ready!",
                description: "Front view generated. Generating other views...",
                duration: 3000,
              });
            }
          }
        );

        // All images generated
        setIsGenerating(false);
        toast({
          title: "Photoshoot Complete!",
          description: "All 3 views generated successfully",
          duration: 3000, // 3 seconds
        });
      } catch (streamError) {
        // Fallback to non-streaming API if streaming fails
        console.warn("Streaming failed, falling back to regular API:", streamError);

        const data = await generatePhotoshoot({
          template_id: selectedTemplate,
          region: backendRegion,
          skin_tone: selectedSkinTone || "Wheatish",
          cloth_image: uploadedFile,
        });

        if (data.status === "success" && data.images) {
          // Convert base64 images to blob URLs
          const views: GeneratedView[] = data.images.map((img) => {
            const blobUrl = photoshootBase64ToBlobUrl(img.image);
            return {
              view: img.view,
              imageUrl: blobUrl || `data:image/png;base64,${img.image}`,
            };
          });
          setGeneratedViews(views);
          setIsGenerating(false);
          toast({
            title: "Photoshoot Generated!",
            description: `Successfully generated ${views.length} views (Front, Side, Angle)`,
          });
        } else {
          throw new Error(data.error || "Failed to generate photoshoot");
        }
      }
    },
    onError: (error: Error | PhotoshootApiError) => {
      setIsGenerating(false);
      const errorMessage = error instanceof PhotoshootApiError
        ? error.detail || error.message
        : error.message;
      toast({
        title: "Generation failed",
        description: errorMessage || "Failed to generate photoshoot. Please try again.",
        variant: "destructive",
      });
    },
  });


  // Note: Health check removed - backend doesn't expose /health endpoint
  // Backend health is verified through actual API calls (getGarmentOptions)

  // Step 1: Get Garment Options mutation (matching Streamlit flow)
  const vtoGetOptionsMutation = useMutation({
    mutationFn: (params: GetGarmentOptionsParams) => getGarmentOptions(params),
    onSuccess: (data) => {
      setVtoMappedSize(data.mapped_size);
      setVtoGarmentOptions(data.garments);
      setVtoState("options_loaded");
      setVtoError(null);

      // Convert base64 images to blob URLs for display
      const imageUrlMap = new Map<string, string>();
      data.garments.forEach((garment) => {
        const blobUrl = base64ToBlobUrl(garment.image_base64);
        if (blobUrl) {
          imageUrlMap.set(garment.path, blobUrl);
        }
      });
      setVtoGarmentImageUrls(imageUrlMap);

      toast({
        title: "Styles Found!",
        description: `Recommended Size: ${data.mapped_size}`,
      });
    },
    onError: (error: Error) => {
      setVtoState("error");
      setVtoError(error.message);
      setVtoGarmentOptions([]);
      toast({
        title: "Failed to Load Options",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Step 2: Generate Try-On mutation (matching Streamlit flow)
  const vtoGenerateMutation = useMutation({
    mutationFn: (params: GenerateTryOnParams) => generateTryOn(params),
    onSuccess: (data) => {
      const url = URL.createObjectURL(data.image);
      setVtoGeneratedImageUrl(url);
      setVtoState("completed");
      setVtoError(null);

      // Add to previewed outfits
      setVtoPreviewedOutfits((prev) => [
        {
          id: "vto-generated",
          imageUrl: url,
          garmentPath: vtoSelectedGarmentPath || undefined,
        },
        ...prev,
      ]);
      setVtoActivePreviewId("vto-generated");

      toast({
        title: "Try-On Generated!",
        description: "Virtual try-on image generated successfully",
      });
    },
    onError: (error: Error) => {
      setVtoState("error");
      setVtoError(error.message);
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fallback dummy KPIs
  const dummyKpis: PhotoshootKPI[] = [
    { label: "Photos Generated Today", value: "1,847", icon: "Camera", change: 12 },
    { label: "Avg Rendering Time", value: "4.2s", icon: "Clock", change: -18 },
    { label: "Cost Saved Today", value: "₹2.8L", icon: "DollarSign", change: 24 },
    { label: "Approval Rate", value: "94%", icon: "CheckCircle", change: 3 },
    { label: "Diversity Score", value: "87/100", icon: "Users", change: 5 },
  ];

  // Fallback dummy Cost Analysis data
  const dummyCostAnalysis: CostAnalysisResponse = {
    regionSavings: [
      { region: "India", saved: "₹12.5L", amount: 1250000, percent: 85 },
      { region: "South Africa", saved: "₹8.2L", amount: 820000, percent: 72 },
      { region: "Global", saved: "₹15.8L", amount: 1580000, percent: 91 },
    ],
    timeToPublish: {
      before: 48,
      after: 4,
      unit: "hours",
    },
    categoryBreakdown: [
      { cat: "Fashion", percent: 45, color: "bg-primary" },
      { cat: "Electronics", percent: 28, color: "bg-info" },
      { cat: "Home & Living", percent: 18, color: "bg-success" },
      { cat: "Others", percent: 9, color: "bg-warning" },
    ],
  };

  // Use dummy KPIs immediately - don't wait for API response
  const kpis = (kpisData && Array.isArray(kpisData.kpis) && kpisData.kpis.length > 0) ? kpisData.kpis : dummyKpis;
  const templates = templatesData && Object.keys(templatesData).length > 0 ? templatesData : mockTemplates;

  // Use dummy Cost Analysis immediately - don't wait for API response
  const costAnalysis = costAnalysisData || dummyCostAnalysis;

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

      // Store file and create preview
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setUploadedFileName(file.name);
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

      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setUploadedFileName(file.name);
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
    setUploadedFile(null);
    setGeneratedViews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "Image removed",
      description: "Upload a new image to continue",
    });
  };

  const handleGeneratePhotoshoot = () => {
    if (!uploadedFile) {
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
    setIsGenerating(true);
    setGeneratedViews([]);
    generateMutation.mutate();
  };

  const handleRegenerate = () => {
    handleGeneratePhotoshoot();
  };

  const handleDownload = async (view?: GeneratedView) => {
    const imageToDownload = view || generatedViews[0];

    if (!imageToDownload && !uploadedImage) {
      toast({
        title: "No image to download",
        description: "Please generate or upload an image first",
        variant: "destructive",
      });
      return;
    }

    const imageUrl = imageToDownload?.imageUrl || uploadedImage;
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = view
        ? `${uploadedFileName?.replace(/\.[^/.]+$/, "") || 'photoshoot'}_${view.view.toLowerCase()}.png`
        : uploadedFileName || 'photoshoot-image.png';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Downloading",
        description: `Downloading ${view ? view.view : 'image'}...`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
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

  // Virtual Try-On handlers
  const handleVtoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processVtoFile(file);
    }
  };

  const processVtoFile = (file: File) => {
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

    setVtoUploadedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setVtoImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleVtoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setVtoIsDragging(true);
  };

  const handleVtoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setVtoIsDragging(false);
  };

  const handleVtoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setVtoIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processVtoFile(file);
    }
  };

  const handleVtoRemoveImage = () => {
    setVtoUploadedImage(null);
    setVtoImagePreview(null);
    if (vtoFileInputRef.current) {
      vtoFileInputRef.current.value = "";
    }
  };

  // Step 1: Get Garment Options (matching Streamlit "Find Styles" button)
  const handleVtoGetOptions = () => {
    if (!vtoCurrentSize.trim()) {
      toast({
        title: "Size required",
        description: "Please enter a size",
        variant: "destructive",
      });
      return;
    }

    setVtoState("loading_options");
    setVtoError(null);
    setVtoSelectedGarmentPath(null);
    setVtoGarmentOptions([]);

    vtoGetOptionsMutation.mutate({
      gender: vtoGender,
      category: vtoCategory,
      current_brand: vtoCurrentBrand,
      current_size: vtoCurrentSize,
      target_brand: vtoTargetBrand,
    });
  };

  // Step 2: Generate Try-On (matching Streamlit "Generate Look" button)
  const handleVtoGenerate = () => {
    if (!vtoSelectedGarmentPath) {
      toast({
        title: "Select a garment",
        description: "Please select a garment style first",
        variant: "destructive",
      });
      return;
    }

    setVtoState("generating");
    setVtoError(null);

    vtoGenerateMutation.mutate({
      garment_path: vtoSelectedGarmentPath,
      gender: vtoGender,
      category: vtoCategory,
      user_image: vtoUploadedImage ?? undefined,
    });
  };

  // Handle garment selection (when user clicks on a garment option)
  const handleVtoSelectGarment = (garment: GarmentOption) => {
    setVtoSelectedGarmentPath(garment.path);
    // Don't add static product images to previewed outfits
    // Only AI-generated images should appear in recommendations
    toast({
      title: "Style Selected",
      description: `Selected: ${garment.filename}. Click "Generate Virtual Try-On" to create AI-generated image.`,
    });
  };


  const handleVtoDownload = () => {
    if (!vtoGeneratedImageUrl) return;
    const link = document.createElement("a");
    link.href = vtoGeneratedImageUrl;
    link.download = `tryon-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Downloaded",
      description: "Image saved successfully",
    });
  };

  const handleVtoRegenerate = () => {
    handleVtoGenerate();
  };

  // Cleanup VTO object URL
  useEffect(() => {
    return () => {
      if (vtoGeneratedImageUrl) {
        URL.revokeObjectURL(vtoGeneratedImageUrl);
      }
    };
  }, [vtoGeneratedImageUrl]);

  const vtoIsReady = vtoCurrentSize.trim() && !vtoGenerateMutation.isPending;
  const vtoHasResult = !!vtoGeneratedImageUrl && !vtoGenerateMutation.isPending && vtoState === "completed";

  // Handle recommendation click (updates preview synchronously)
  // Only called when user explicitly clicks - no auto-selection
  const handleVtoThumbnailClick = (outfitId: string) => {
    setVtoActivePreviewId(outfitId);
    // Preview will update automatically via vtoActivePreviewImage useMemo
  };

  // Handle image click in recommendations (opens focus modal)
  const handleVtoImageClick = (e: React.MouseEvent, outfitId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent thumbnail click handler
    const outfit = vtoPreviewedOutfits.find((o) => o.id === outfitId);
    if (outfit) {
      setFocusedImage({ imageUrl: outfit.imageUrl, id: outfit.id });
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setFocusedImage(null);
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (focusedImage) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [focusedImage]);

  // Handle Esc key to close modal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && focusedImage) {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleEscKey);
    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [focusedImage]);

  // Get active preview image
  const vtoActivePreviewImage = useMemo(() => {
    if (vtoActivePreviewId) {
      const outfit = vtoPreviewedOutfits.find((o) => o.id === vtoActivePreviewId);
      if (outfit) return outfit.imageUrl;
    }
    if (vtoGeneratedImageUrl) return vtoGeneratedImageUrl;
    return null;
  }, [vtoActivePreviewId, vtoPreviewedOutfits, vtoGeneratedImageUrl]);

  // When a new try-on is generated, add it to previewed outfits (but do NOT auto-select)
  useEffect(() => {
    if (vtoGeneratedImageUrl && !vtoPreviewedOutfits.some((o) => o.id === "vto-generated")) {
      setVtoPreviewedOutfits((prev) => [
        {
          id: "vto-generated",
          imageUrl: vtoGeneratedImageUrl,
          garmentPath: vtoSelectedGarmentPath || undefined,
        },
        ...prev,
      ]);
      // Do NOT auto-select - let user click to preview
      // setVtoActivePreviewId("vto-generated");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vtoGeneratedImageUrl]);

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 max-w-[1920px] mx-auto w-full">
        {/* Enhanced Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-ai/10 to-ai/5 border border-ai/20">
                <Camera className="w-4 h-4 text-ai" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">
                  AI Image Generation
                </h1>
                <p className="text-xs text-muted-foreground">
                  Generate professional product imagery with AI
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge className="bg-gradient-to-w from-ai/10 to-ai/5 text-ai border-ai/20 px-2 py-0.5 text-[10px]">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
              {kpisData && (
                <Badge className="bg-success/10 text-success border-success/20 px-2 py-0.5 text-[10px]">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Main Tabs */}
        <Tabs defaultValue="photoshoot" className="space-y-4">
          <TabsList className="w-full grid grid-cols-2 max-w-md h-12 bg-muted/50 border border-border/50 rounded-lg p-1 relative">
            <TabsTrigger
              value="photoshoot"
              className={cn(
                "relative z-10 transition-all duration-300 font-medium",
                "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md",
                "data-[state=active]:scale-[1.02] data-[state=inactive]:text-muted-foreground",
                "hover:bg-background/50 hover:text-foreground"
              )}
            >
              <Camera className="w-4 h-4 mr-2 inline" />
              AI Photoshoot
            </TabsTrigger>
            <TabsTrigger
              value="tryon"
              className={cn(
                "relative z-10 transition-all duration-300 font-medium",
                "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md",
                "data-[state=active]:scale-[1.02] data-[state=inactive]:text-muted-foreground",
                "hover:bg-background/50 hover:text-foreground"
              )}
            >
              <User className="w-4 h-4 mr-2 inline" />
              Virtual Try-On
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photoshoot" className="space-y-4 mt-0">
            {/* Enhanced KPI Row */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Performance Metrics</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
                {kpis.map((kpi, index) => {
                  const Icon = iconMap[kpi.icon] || Camera;
                  return (
                    <div
                      key={kpi.label}
                      className={cn(
                        "rounded-xl p-5 border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
                        "bg-gradient-to-br from-card/50 to-card/30 border-border/50 backdrop-blur-sm",
                        "animate-fade-in"
                      )}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: 'forwards',
                        animationDuration: '400ms'
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground">{kpi.value}</span>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs font-semibold",
                              kpi.change > 0 ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"
                            )}
                          >
                            {kpi.change > 0 ? '+' : ''}{kpi.change}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Enhanced Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Enhanced Template Selector */}
              <div className="rounded-xl p-4 lg:p-6 border border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards', animationDuration: '500ms' }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Model Style Selection</h3>
                </div>

                <Tabs value={activeRegion} onValueChange={(value) => setActiveRegion(value as "indian" | "southAfrican" | "global")}>
                  <TabsList className="w-full grid grid-cols-3 mb-4 h-10 bg-muted/50 border border-border/50 rounded-lg p-1">
                    <TabsTrigger
                      value="indian"
                      className={cn(
                        "relative transition-all duration-300 text-xs font-medium",
                        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md",
                        "data-[state=active]:scale-[1.05] data-[state=inactive]:text-muted-foreground",
                        "hover:bg-primary/10 hover:text-foreground"
                      )}
                    >
                      🇮🇳 Indian
                    </TabsTrigger>
                    <TabsTrigger
                      value="southAfrican"
                      className={cn(
                        "relative transition-all duration-300 text-xs font-medium",
                        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md",
                        "data-[state=active]:scale-[1.05] data-[state=inactive]:text-muted-foreground",
                        "hover:bg-primary/10 hover:text-foreground"
                      )}
                    >
                      🇿🇦 South African
                    </TabsTrigger>
                    <TabsTrigger
                      value="global"
                      className={cn(
                        "relative transition-all duration-300 text-xs font-medium",
                        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md",
                        "data-[state=active]:scale-[1.05] data-[state=inactive]:text-muted-foreground",
                        "hover:bg-primary/10 hover:text-foreground"
                      )}
                    >
                      🌍 Global
                    </TabsTrigger>
                  </TabsList>

                  {templatesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : templatesData ? (
                    Object.entries(templatesData).map(([region, items]) => (
                      <TabsContent key={region} value={region} className="mt-0">
                        <div className="grid grid-cols-2 gap-2">
                          {items.map((template) => (
                            <div
                              key={template.id}
                              onClick={() => setSelectedTemplate(String(template.id))}
                              className={cn(
                                "p-2.5 rounded-lg border-2 cursor-pointer transition-all duration-300 group",
                                "hover:border-primary/50 hover:bg-primary/5 hover:shadow-md",
                                selectedTemplate === String(template.id)
                                  ? "border-primary bg-primary/10 shadow-md scale-[1.02]"
                                  : "border-border/50 hover:scale-[1.01]"
                              )}
                            >
                              <div className="aspect-square bg-gradient-to-br from-sand-100 to-sand-200 rounded-lg mb-2 overflow-hidden transition-transform duration-300 group-hover:scale-105 flex items-center justify-center">
                                {template.previewUrl ? (
                                  <img
                                    src={template.previewUrl}
                                    alt={template.name}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      // Fallback to placeholder if image fails to load
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><Camera class="w-8 h-8 text-sand-400" /></div>';
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Camera className="w-8 h-8 text-sand-400" />
                                  </div>
                                )}
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-semibold text-foreground text-xs leading-tight">{template.name}</h4>
                                <Badge variant="secondary" className="text-[10px] font-medium py-0 px-1.5">
                                  {typeof template.uses === 'number'
                                    ? template.uses.toLocaleString()
                                    : template.uses} uses
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    ))
                  ) : templatesError ? (
                    <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20 text-center">
                      <p className="text-sm text-destructive">
                        Failed to load templates. Make sure the backend is running at {import.meta.env.VITE_PHOTOSHOOT_API_URL || "http://localhost:8000"}
                      </p>
                    </div>
                  ) : null}
                </Tabs>

                {/* Skin Tone Selector */}
                <div className="mt-4 pt-3 border-t border-border/30">
                  <h4 className="text-xs font-medium text-foreground mb-2">Skin Tone</h4>
                  <div className="flex gap-1.5">
                    {[
                      { color: '#f5d0c5', label: 'Fair' },
                      { color: '#e8b89a', label: 'Light' },
                      { color: '#d4a574', label: 'Wheatish' },
                      { color: '#c68642', label: 'Tan' },
                      { color: '#8d5524', label: 'Brown' },
                      { color: '#5c3c24', label: 'Deep Dark' },
                    ].map((tone) => (
                      <button
                        key={tone.color}
                        onClick={() => setSelectedSkinTone(tone.label)}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-colors",
                          selectedSkinTone === tone.label
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary"
                        )}
                        style={{ backgroundColor: tone.color }}
                        title={tone.label}
                      />
                    ))}
                  </div>
                  {selectedSkinTone && (
                    <p className="text-[10px] text-muted-foreground mt-1.5">Selected: {selectedSkinTone}</p>
                  )}
                </div>
              </div>

              {/* Enhanced Before/After Viewer */}
              <div className="rounded-xl p-4 lg:p-6 border border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in flex flex-col h-full" style={{ animationDelay: '300ms', animationFillMode: 'forwards', animationDuration: '500ms' }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Camera className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Image Preview</h3>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex-1 flex flex-col min-h-0">
                  <div
                    className="flex-1 bg-gradient-to-br from-sand-50 to-sand-100 rounded-xl mb-3 flex items-center justify-center border-2 border-dashed border-border/50 relative overflow-auto cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={!uploadedImage ? handleBrowseFiles : undefined}
                  >
                    {generatedViews.length > 0 ? (
                      <div className="relative w-full h-full p-3">
                        <Tabs defaultValue={generatedViews[0]?.view} className="w-full h-full flex flex-col">
                          <TabsList className="grid w-full grid-cols-3 mb-3 h-9 bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg p-1 shrink-0">
                            {generatedViews.map((view) => (
                              <TabsTrigger
                                key={view.view}
                                value={view.view}
                                className={cn(
                                  "relative transition-all duration-300 text-xs font-medium py-1.5",
                                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md",
                                  "data-[state=active]:scale-[1.05] data-[state=inactive]:text-muted-foreground",
                                  "hover:bg-primary/10 hover:text-foreground",
                                  "flex items-center justify-center gap-1.5"
                                )}
                              >
                                {view.view === "Front" && <Camera className="w-3 h-3" />}
                                {view.view === "Side" && <ArrowRight className="w-3 h-3 rotate-90" />}
                                {view.view === "Angle" && <Zap className="w-3 h-3" />}
                                {view.view}
                              </TabsTrigger>
                            ))}
                            {/* Show placeholder tabs for views still generating */}
                            {isGenerating && generatedViews.length < 3 && (
                              <>
                                {!generatedViews.find(v => v.view === "Side") && (
                                  <TabsTrigger
                                    value="side-loading"
                                    disabled
                                    className="text-xs py-1.5 opacity-40 text-muted-foreground"
                                  >
                                    Side...
                                  </TabsTrigger>
                                )}
                                {!generatedViews.find(v => v.view === "Angle") && (
                                  <TabsTrigger
                                    value="angle-loading"
                                    disabled
                                    className="text-xs py-1.5 opacity-40 text-muted-foreground"
                                  >
                                    Angle...
                                  </TabsTrigger>
                                )}
                              </>
                            )}
                          </TabsList>
                          <div className="flex-1 overflow-auto">
                            {generatedViews.map((view) => (
                              <TabsContent key={view.view} value={view.view} className="mt-0 h-full">
                                <div className="relative w-full h-full flex items-center justify-center bg-muted/30 rounded-xl p-3 group">
                                  {view.imageUrl && (
                                    <img
                                      key={`img-${view.view}-${view.imageUrl.substring(0, 30)}`}
                                      src={view.imageUrl}
                                      alt={`${view.view} view`}
                                      className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-lg"
                                      loading="eager"
                                      decoding="sync"
                                      fetchPriority="high"
                                      style={{
                                        imageRendering: 'auto',
                                        opacity: 1,
                                        transition: 'opacity 0.2s ease-in'
                                      }}
                                      onLoad={(e) => {
                                        console.log(`✅ ${view.view} view rendered and visible`);
                                        const target = e.target as HTMLImageElement;
                                        target.style.opacity = '1';
                                      }}
                                      onError={(e) => {
                                        console.error(`❌ Failed to load ${view.view} view`);
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  )}
                                  {isGenerating && generatedViews.length < 3 && (
                                    <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] px-2 py-1 rounded z-10">
                                      {generatedViews.length}/3
                                    </div>
                                  )}
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveImage();
                                      }}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </TabsContent>
                            ))}
                          </div>
                        </Tabs>
                      </div>
                    ) : isGenerating && generatedViews.length === 0 ? (
                      <div className="flex flex-col items-center justify-center space-y-2 py-8">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          <span className="text-xs text-muted-foreground">Generating 3 views...</span>
                        </div>
                        <Progress value={undefined} className="w-2/3 h-1" />
                      </div>
                    ) : uploadedImage ? (
                      <div className="relative w-full h-full p-3 flex items-center justify-center group">
                        <img
                          src={uploadedImage}
                          alt="Uploaded product"
                          className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-lg"
                        />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage();
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        {uploadedFileName && (
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="bg-black/70 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm truncate">
                              {uploadedFileName}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Upload className="w-10 h-10 text-sand-400 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Upload product image</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">or drag and drop</p>
                        <Button size="sm" variant="outline" className="mt-2 h-8 text-xs" onClick={handleBrowseFiles}>
                          Browse Files
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Original</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="text-foreground font-medium">AI Generated</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 h-7 text-xs"
                    onClick={handleRegenerate}
                    disabled={isGenerating || !uploadedFile}
                  >
                    <RefreshCw className="w-3 h-3" />
                    Regenerate
                  </Button>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button
                    className="flex-1 gap-1.5 h-8 text-xs"
                    onClick={handleGeneratePhotoshoot}
                    disabled={isGenerating || !uploadedFile || !selectedTemplate}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        Generate 3 Views
                      </>
                    )}
                  </Button>
                  {generatedViews.length > 0 && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload()}
                      title="Download all views"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                {/* Download individual views */}
                {generatedViews.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/30 shrink-0">
                    <p className="text-[10px] text-muted-foreground mb-1.5">Download views:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {generatedViews.map((view) => (
                        <Button
                          key={view.view}
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(view)}
                          className="gap-1 h-7 text-[10px] px-2"
                        >
                          <Download className="w-2.5 h-2.5" />
                          {view.view}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Export Options */}
                <div className="mt-4 pt-4 border-t border-border/30">
                  <p className="text-xs font-medium text-foreground mb-2">Export for:</p>
                  <div className="flex flex-wrap gap-2">
                    {['Amazon', 'Flipkart', 'Takealot', 'eBay', 'Shopify'].map((mp) => (
                      <Badge
                        key={mp}
                        variant={selectedMarketplace.has(mp) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-all duration-300 font-medium text-xs px-3 py-1",
                          selectedMarketplace.has(mp)
                            ? "bg-primary text-primary-foreground shadow-md scale-105 border-primary"
                            : "hover:bg-primary/10 hover:border-primary/50 hover:scale-105 border-border"
                        )}
                        onClick={() => toggleMarketplace(mp)}
                      >
                        {selectedMarketplace.has(mp) && <CheckCircle className="w-3 h-3 mr-1.5 inline" />}
                        {mp}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Cost Efficiency Panel */}
            <div className="rounded-xl p-6 lg:p-8 border border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'forwards', animationDuration: '500ms' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-success/10">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Cost & Efficiency Analysis</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-success/5 rounded-xl">
                  <h4 className="text-sm font-medium text-foreground mb-2">Cost Savings by Region</h4>
                  <div className="space-y-3">
                    {costAnalysis.regionSavings.map((item) => (
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
                      <span className="text-sm font-medium">{costAnalysis.timeToPublish.before} {costAnalysis.timeToPublish.unit}</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <div className="flex-1 w-full bg-muted rounded-t-lg relative">
                        <div
                          className="absolute bottom-0 w-full bg-info rounded-t-lg"
                          style={{ height: `${(costAnalysis.timeToPublish.after / costAnalysis.timeToPublish.before) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground mt-2">After AI</span>
                      <span className="text-sm font-medium text-info">{costAnalysis.timeToPublish.after} {costAnalysis.timeToPublish.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-xl">
                  <h4 className="text-sm font-medium text-foreground mb-2">Category Breakdown</h4>
                  <div className="space-y-2">
                    {costAnalysis.categoryBreakdown.map((item) => (
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
          </TabsContent>

          <TabsContent value="tryon" className="space-y-6 mt-0">
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
                      <Select value={vtoGender} onValueChange={(v) => setVtoGender(v as "male" | "female")}>
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
                        ref={vtoFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleVtoFileChange}
                        className="hidden"
                      />
                      {vtoImagePreview ? (
                        <div className="relative group">
                          <div className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-border shadow-md">
                            <img
                              src={vtoImagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-3 right-3 h-9 w-9 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                            onClick={handleVtoRemoveImage}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "aspect-[3/4] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
                            vtoIsDragging
                              ? "border-primary bg-primary/5 scale-[1.02]"
                              : "border-border/50 bg-muted/30 hover:border-primary/50 hover:bg-primary/5"
                          )}
                          onDragOver={handleVtoDragOver}
                          onDragLeave={handleVtoDragLeave}
                          onDrop={handleVtoDrop}
                          onClick={() => vtoFileInputRef.current?.click()}
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
                      {!vtoUploadedImage && (
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
                        <Select value={vtoCategory} onValueChange={(v) => setVtoCategory(v as typeof vtoCategory)}>
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
                        <Select value={vtoGender} onValueChange={(v) => setVtoGender(v as "male" | "female")}>
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
                      <Select value={vtoCurrentBrand} onValueChange={(v) => setVtoCurrentBrand(v as typeof vtoCurrentBrand)}>
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
                      <Select
                        value={vtoCurrentSize}
                        onValueChange={(v) => setVtoCurrentSize(v)}
                        disabled={vtoSupportedSizes.length === 0}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={vtoSupportedSizes.length === 0 ? "Loading sizes..." : "Select size"} />
                        </SelectTrigger>
                        <SelectContent>
                          {vtoSupportedSizes.length > 0 ? (
                            vtoSupportedSizes.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="M" disabled>Loading...</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2.5 block flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" />
                        Target Brand
                      </label>
                      <Select value={vtoTargetBrand} onValueChange={(v) => setVtoTargetBrand(v as typeof vtoTargetBrand)}>
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
                    {vtoMappedSize && (
                      <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              Target Mapped Size
                            </div>
                            <div className="text-2xl font-bold text-primary">{vtoMappedSize}</div>
                          </div>
                          <div className="p-2 rounded-lg bg-primary/10">
                            <CheckCircle className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Backend Status Card */}
                <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Backend Status</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Backend health is verified through API calls. Use "Find Styles" to test connection.
                    </p>
                  </div>
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
                      {vtoPreviewedOutfits.length > 0
                        ? `${vtoPreviewedOutfits.length} AI-generated try-on ${vtoPreviewedOutfits.length === 1 ? 'image' : 'images'}`
                        : vtoState === "options_loaded" || vtoState === "completed"
                          ? "Generate virtual try-on images to see recommendations here"
                          : "AI-generated try-on images will appear here"}
                    </p>
                  </div>

                  {/* Top Smart Recommendations - AI-Generated Images Only */}
                  {vtoPreviewedOutfits.length > 0 ? (
                    <div className="mb-6">
                      <div className="flex items-center gap-3 pb-2">
                        {vtoPreviewedOutfits.map((outfit) => (
                          <button
                            key={outfit.id}
                            onClick={() => handleVtoThumbnailClick(outfit.id)}
                            className={cn(
                              "group relative flex-shrink-0 w-24 h-32 rounded-lg overflow-hidden border-2 transition-all duration-300",
                              vtoActivePreviewId === outfit.id
                                ? "border-primary shadow-lg shadow-primary/30 scale-105"
                                : "border-border/50 hover:border-primary/50 hover:shadow-md hover:scale-[1.02]"
                            )}
                          >
                            {outfit.imageUrl ? (
                              <>
                                <img
                                  src={outfit.imageUrl}
                                  alt="AI-generated try-on"
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 cursor-pointer"
                                  onClick={(e) => handleVtoImageClick(e, outfit.id)}
                                  onError={(e) => {
                                    console.error(`Failed to load image for outfit ${outfit.id}:`, outfit.imageUrl);
                                    // Show placeholder on error
                                    const target = e.target as HTMLImageElement;
                                    const placeholder = target.nextElementSibling as HTMLElement;
                                    if (placeholder) {
                                      target.style.display = 'none';
                                      placeholder.style.display = 'flex';
                                    }
                                  }}
                                />
                                <div className="hidden w-full h-full bg-muted/50 flex items-center justify-center">
                                  <Camera className="w-8 h-8 text-muted-foreground/50" />
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                                <Camera className="w-8 h-8 text-muted-foreground/50" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            {vtoActivePreviewId === outfit.id && (
                              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md">
                                <CheckCircle className="w-3 h-3 text-primary-foreground" />
                              </div>
                            )}
                            <div className="absolute bottom-1 left-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-[10px] font-medium text-white bg-black/70 px-1.5 py-0.5 rounded truncate">
                                AI Generated
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : vtoState === "loading_options" || vtoGetOptionsMutation.isPending ? (
                    <div className="mb-6">
                      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="flex-shrink-0 w-24 h-32 rounded-lg bg-muted/50 animate-pulse border border-border/50"
                          />
                        ))}
                      </div>
                    </div>
                  ) : vtoState === "error" && vtoError ? (
                    <div className="mb-6 p-4 bg-destructive/10 rounded-xl border border-destructive/20 text-center">
                      <p className="text-sm text-destructive">{vtoError}</p>
                    </div>
                  ) : vtoState === "options_loaded" && vtoGarmentOptions.length === 0 ? (
                    <div className="mb-6 p-4 bg-muted/30 rounded-xl border border-border/50 text-center">
                      <p className="text-sm text-muted-foreground">
                        No styles found. Try adjusting your search criteria.
                      </p>
                    </div>
                  ) : (
                    <div className="mb-6 p-4 bg-muted/30 rounded-xl border border-border/50 text-center">
                      <p className="text-sm text-muted-foreground">
                        Click "Find Styles" to begin, then generate try-on images to see recommendations here.
                      </p>
                    </div>
                  )}

                  {/* Step 1: Find Styles Button (matching Streamlit) */}
                  <div className="mb-6">
                    <Button
                      size="lg"
                      onClick={handleVtoGetOptions}
                      disabled={!vtoCurrentSize.trim() || vtoGetOptionsMutation.isPending}
                      className={cn(
                        "w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300",
                        "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                      )}
                    >
                      {vtoGetOptionsMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Checking inventory...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Find Styles
                        </>
                      )}
                    </Button>

                    {vtoMappedSize && vtoState === "options_loaded" && (
                      <div className="mt-4 p-3 bg-success/10 rounded-lg border border-success/20 text-center">
                        <p className="text-sm font-semibold text-success">
                          Recommended Size: <span className="text-lg">{vtoMappedSize}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Garment Selection (Compact - Hidden after selection) */}
                  {vtoGarmentOptions.length > 0 && !vtoSelectedGarmentPath && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-foreground mb-3">Select a Style to Generate</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {vtoGarmentOptions.map((garment) => {
                          const imageUrl = vtoGarmentImageUrls.get(garment.path);
                          return (
                            <button
                              key={garment.path}
                              onClick={() => handleVtoSelectGarment(garment)}
                              className={cn(
                                "group relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300",
                                "border-border/50 hover:border-primary/50 hover:shadow-md hover:scale-[1.02]"
                              )}
                            >
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={garment.filename}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                <p className="text-xs font-medium text-white text-center truncate">
                                  SKU {garment.sku_index}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {vtoMappedSize && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          Size {vtoMappedSize}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Selected Garment Indicator */}
                  {vtoSelectedGarmentPath && vtoGarmentOptions.length > 0 && (
                    <div className="mb-6 p-3 bg-primary/10 rounded-lg border border-primary/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {vtoGarmentImageUrls.has(vtoSelectedGarmentPath) && (
                          <img
                            src={vtoGarmentImageUrls.get(vtoSelectedGarmentPath)}
                            alt="Selected garment"
                            className="w-16 h-16 rounded-lg object-cover border-2 border-primary/50"
                          />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-foreground">Style Selected</p>
                          <p className="text-xs text-muted-foreground">
                            {vtoGarmentOptions.find(g => g.path === vtoSelectedGarmentPath)?.filename || "Ready to generate"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVtoSelectedGarmentPath(null)}
                        className="text-xs"
                      >
                        Change
                      </Button>
                    </div>
                  )}

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
                      onClick={handleVtoGenerate}
                      disabled={!vtoIsReady}
                      className={cn(
                        "min-w-[280px] h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300",
                        vtoIsReady && "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                      )}
                    >
                      {vtoGenerateMutation.isPending ? (
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
                  {vtoGenerateMutation.isPending && (
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

                  {/* Main Preview Display - Interactive (only shows when user clicks a recommendation) */}
                  {vtoActivePreviewImage ? (
                    <div className="flex-1 space-y-6 animate-fade-in">
                      {vtoHasResult && vtoActivePreviewId === "vto-generated" && (
                        <div className="flex items-center justify-center gap-2 p-3 bg-success/10 rounded-lg border border-success/20">
                          <CheckCircle className="w-5 h-5 text-success" />
                          <span className="font-semibold text-success">Try-On Generated Successfully!</span>
                        </div>
                      )}
                      <div className="relative group rounded-2xl overflow-hidden border-2 border-border bg-muted/20 shadow-2xl transition-all duration-500">
                        <img
                          key={vtoActivePreviewId || "default"}
                          src={vtoActivePreviewImage}
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
                            {vtoActivePreviewId === "vto-generated"
                              ? "Final Result from Gemini 3"
                              : vtoSelectedGarmentPath
                                ? `Preview: ${vtoSelectedGarmentPath.split('/').pop() || "Selected Garment"}`
                                : "Virtual Try-On Preview"}
                          </p>
                          {vtoMappedSize && vtoActivePreviewId === "vto-generated" && (
                            <p className="text-xs text-muted-foreground">
                              Mapped size: <span className="font-semibold text-primary">{vtoMappedSize}</span>
                            </p>
                          )}
                        </div>
                        {vtoHasResult && vtoActivePreviewId === "vto-generated" && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleVtoDownload}
                              className="gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleVtoRegenerate}
                              className="gap-2"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Regenerate
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Empty State - No selection made yet */
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-16 px-4">
                      <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center border-2 border-dashed border-border/50">
                        <Camera className="w-10 h-10 text-muted-foreground/50" />
                      </div>
                      <div className="text-center space-y-2 max-w-sm">
                        <p className="text-lg font-semibold text-foreground">Select an Image to Preview</p>
                        <p className="text-sm text-muted-foreground">
                          {vtoPreviewedOutfits.length > 0
                            ? "Click on any AI-generated try-on image above to see it in the preview"
                            : "Generate virtual try-on images to see recommendations"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Empty State - Initial state */}
                  {vtoState === "idle" && !vtoGetOptionsMutation.isPending && (
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

                  {/* Empty State - When options are loaded but none selected */}
                  {vtoState === "options_loaded" && !vtoSelectedGarmentPath && !vtoGenerateMutation.isPending && (
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
                        <p className="text-xl font-semibold text-foreground">Select a Garment</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Click on any garment above to select it, then click "Generate Look" to create your virtual try-on
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {vtoGenerateMutation.isError && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-full max-w-md p-6 bg-destructive/10 border-2 border-destructive/20 rounded-xl space-y-4">
                        <div className="flex items-center gap-3 text-destructive">
                          <div className="p-2 rounded-lg bg-destructive/20">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">Generation Failed</div>
                            <div className="text-sm text-destructive/80">
                              {vtoGenerateMutation.error instanceof Error
                                ? vtoGenerateMutation.error.message
                                : "Unknown error occurred"}
                            </div>
                          </div>
                        </div>
                        {vtoGenerateMutation.error instanceof Error &&
                          vtoGenerateMutation.error.message.includes("Could not connect") && (
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
                          onClick={handleVtoGenerate}
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Image Focus Modal */}
      {focusedImage && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in fade-in-0 duration-300"
          onClick={handleCloseModal}
          aria-modal="true"
          role="dialog"
          aria-label="Image preview"
        >
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
          />

          {/* Close Button */}
          <button
            onClick={handleCloseModal}
            className="absolute top-4 right-4 z-[1001] w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close preview"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Image Container */}
          <div
            className="relative z-[1001] max-w-[90vw] max-h-[90vh] w-auto h-auto animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={focusedImage.imageUrl}
              alt="AI-generated try-on preview"
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
              style={{
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
