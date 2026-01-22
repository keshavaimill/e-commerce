/**
 * AI Photoshoot API Service
 * 
 * This service layer integrates with the ai-photoshoot-proto-main backend.
 * Endpoints are defined in ai-photoshoot-proto-main/backend/main.py
 * 
 * Base URL: Configured via VITE_PHOTOSHOOT_API_URL environment variable
 * Default: http://localhost:8000 (local development)
 */

const PHOTOSHOOT_BASE_URL = import.meta.env.VITE_PHOTOSHOOT_API_URL ?? "http://localhost:8000";

// ==================================================
// TYPE DEFINITIONS
// ==================================================

export interface PhotoshootTemplate {
  id: string;
  name: string;
  uses: string;
  img: string;
  prompt: string;
}

export interface PhotoshootTemplatesResponse {
  Indian: PhotoshootTemplate[];
  "South African": PhotoshootTemplate[];
  Global: PhotoshootTemplate[];
}

export interface GeneratePhotoshootRequest {
  template_id: string;
  region: string;
  skin_tone: string;
  cloth_image: File;
}

export interface GeneratedImageView {
  view: "Front" | "Side" | "Angle";
  image: string; // base64 encoded image
}

export interface GeneratePhotoshootResponse {
  status: "success" | "error";
  images: GeneratedImageView[];
  error?: string;
}

// ==================================================
// ERROR HANDLING
// ==================================================

export class PhotoshootApiError extends Error {
  status: number;
  detail?: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = "PhotoshootApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function handlePhotoshootResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    let errorDetail: string | undefined;

    if (isJson) {
      try {
        const body = await res.json();
        errorMessage = body?.detail || body?.error || body?.message || errorMessage;
        errorDetail = body?.detail;
      } catch {
        // Ignore parse error, use default message
      }
    }

    throw new PhotoshootApiError(errorMessage, res.status, errorDetail);
  }

  if (!isJson) {
    // @ts-expect-error - caller should know it's not JSON
    return res as unknown as T;
  }

  return (await res.json()) as T;
}

// ==================================================
// API FUNCTIONS
// ==================================================

/**
 * Fetch all photoshoot templates organized by region
 */
export async function getPhotoshootTemplates(): Promise<PhotoshootTemplatesResponse> {
  const url = `${PHOTOSHOOT_BASE_URL}/templates`;
  const res = await fetch(url);
  return handlePhotoshootResponse<PhotoshootTemplatesResponse>(res);
}

/**
 * Generate photoshoot with 3 views (Front, Side, Angle)
 * @param params - Generation parameters including template, region, skin tone, and image
 * @returns Response with base64-encoded images for each view
 */
export async function generatePhotoshoot(
  params: GeneratePhotoshootRequest
): Promise<GeneratePhotoshootResponse> {
  const url = `${PHOTOSHOOT_BASE_URL}/generate-photoshoot`;
  
  const formData = new FormData();
  formData.append("template_id", params.template_id);
  formData.append("region", params.region);
  formData.append("skin_tone", params.skin_tone);
  formData.append("cloth_image", params.cloth_image);

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  return handlePhotoshootResponse<GeneratePhotoshootResponse>(res);
}

/**
 * Generate photoshoot with streaming support - images arrive as they're generated
 * @param params - Generation parameters
 * @param onProgress - Callback function called when each image is generated (with blob URL)
 * @returns Promise that resolves when all images are generated
 */
export async function generatePhotoshootStream(
  params: GeneratePhotoshootRequest,
  onProgress: (view: { view: "Front" | "Side" | "Angle"; imageUrl: string }) => void
): Promise<void> {
  const url = `${PHOTOSHOOT_BASE_URL}/generate-photoshoot`;
  
  const formData = new FormData();
  formData.append("template_id", params.template_id);
  formData.append("region", params.region);
  formData.append("skin_tone", params.skin_tone);
  formData.append("cloth_image", params.cloth_image);
  formData.append("stream", "true");

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Streaming request failed:", res.status, errorText);
    throw new PhotoshootApiError(
      `Request failed with status ${res.status}`,
      res.status,
      errorText
    );
  }

  // Check if response is actually a stream
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("text/event-stream")) {
    console.warn("Response is not a stream, content-type:", contentType);
    throw new PhotoshootApiError("Server did not return a stream", 500);
  }

  // Handle Server-Sent Events stream
  const reader = res.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new PhotoshootApiError("Response body is not readable", 500);
  }

  console.log("Starting to read stream...");

  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim() === "") continue; // Skip empty lines
        
        if (line.startsWith("data: ")) {
          try {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            
            const data = JSON.parse(jsonStr);
            
            if (data.status === "progress" && data.view && data.image) {
              console.log(`⚡ Received ${data.view} view - displaying immediately`);
              
              // Use base64 data URL directly for INSTANT display (no conversion delay)
              // Base64 data URLs render immediately in browsers
              const imageUrl = data.image.startsWith('data:') 
                ? data.image 
                : `data:image/png;base64,${data.image}`;
              
              // Call progress callback IMMEDIATELY - no async operations
              onProgress({
                view: data.view as "Front" | "Side" | "Angle",
                imageUrl: imageUrl,
              });
              
              console.log(`✅ ${data.view} view sent to UI`);
            } else if (data.status === "completed") {
              console.log("Stream completed successfully");
              return; // All images generated
            } else if (data.status === "error") {
              console.error("Stream error:", data.message);
              throw new PhotoshootApiError(data.message || "Generation failed", 500);
            }
          } catch (e) {
            if (e instanceof PhotoshootApiError) throw e;
            // Log parsing errors but continue processing
            console.error("Error parsing SSE data:", e, "Line:", line);
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof PhotoshootApiError) throw error;
    throw new PhotoshootApiError(
      error instanceof Error ? error.message : "Stream reading failed",
      500
    );
  }
}

/**
 * Convert base64 string to blob URL for display
 * Note: This is different from the one in vto-api.ts - this one is specifically for photoshoot images
 */
export function base64ToBlobUrl(base64: string, mimeType: string = "image/png"): string | null {
  try {
    // Remove data URL prefix if present
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error converting base64 to blob URL:", error);
    return null;
  }
}
