/**
 * Image-to-Text API Client
 * Connects to the FastAPI backend for image-to-text description generation
 */

const IMAGE_TO_TEXT_BASE_URL = import.meta.env.VITE_IMAGE_TO_TEXT_API_URL ?? "https://e-commerce-1-imageto-txt.onrender.com";

export interface GenerateDescriptionResponse {
  title: string;
  short_description: string;
  long_description?: string;
  bullet_points: string[];
  attributes: Record<string, string>;
}

export interface UploadImageResponse {
  success: boolean;
  imageId: string;
  url: string;
  filename: string;
  sku?: string;
}

export interface GenerateProductTextResponse {
  success: boolean;
  jobId: string;
  title: string;
  shortDescription: string;
  bulletPoints: string[];
  attributes: Array<{
    name: string;
    value: string;
    confidence: number;
  }>;
}

export interface Translation {
  code: string;
  name: string;
  flag: string;
  status: "complete" | "pending" | "error";
  title?: string | null;
  description?: string | null;
  bulletPoints?: string[] | null;
}

export interface TranslationsResponse {
  imageId: string;
  translations: Translation[];
}

export interface QualityCheck {
  code: string;
  name: string;
  flag: string;
  status: "complete" | "pending" | "error";
  checks: {
    grammar: boolean;
    keywords: number;
    cultural: number;
    forbidden: boolean;
  };
}

export interface QualityCheckResponse {
  imageId: string;
  qualityChecks: QualityCheck[];
}

export interface KPI {
  label: string;
  value: string;
  icon: string;
  change: number;
}

export interface KPIsResponse {
  kpis: KPI[];
}

export class ImageToTextApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ImageToTextApiError";
    this.status = status;
    this.code = code;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    try {
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const body = await res.json();
        errorMessage = body.detail || body.error?.message || errorMessage;
      } else {
        errorMessage = await res.text() || errorMessage;
      }
    } catch {
      // Ignore parse errors
    }
    throw new ImageToTextApiError(errorMessage, res.status);
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return (await res.json()) as T;
  }

  return (await res.text()) as unknown as T;
}

/**
 * Generate description directly from image file (like Streamlit app)
 */
export async function generateDescription(
  file: File,
  language: string
): Promise<GenerateDescriptionResponse> {
  const url = `${IMAGE_TO_TEXT_BASE_URL}/generate-description`;
  const formData = new FormData();
  formData.append("image", file);
  formData.append("language", language);

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    return await handleResponse<GenerateDescriptionResponse>(res);
  } catch (error) {
    if (error instanceof ImageToTextApiError) {
      throw error;
    }
    throw new ImageToTextApiError(
      `Could not connect to FastAPI backend at ${IMAGE_TO_TEXT_BASE_URL}. Please ensure the server is running.`,
      0
    );
  }
}

/**
 * Upload image and get imageId
 */
export async function uploadImage(
  file: File,
  sku?: string
): Promise<UploadImageResponse> {
  const url = `${IMAGE_TO_TEXT_BASE_URL}/image-to-text/upload`;
  const formData = new FormData();
  formData.append("file", file);
  if (sku) {
    formData.append("sku", sku);
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    return await handleResponse<UploadImageResponse>(res);
  } catch (error) {
    if (error instanceof ImageToTextApiError) {
      throw error;
    }
    throw new ImageToTextApiError(
      `Could not connect to FastAPI backend at ${IMAGE_TO_TEXT_BASE_URL}. Please ensure the server is running.`,
      0
    );
  }
}

/**
 * Generate product text from uploaded imageId
 */
export async function generateProductText(params: {
  imageId: string;
  language: string;
  region?: string;
  marketplace?: string;
  sku?: string;
}): Promise<GenerateProductTextResponse> {
  const url = `${IMAGE_TO_TEXT_BASE_URL}/image-to-text/generate`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageId: params.imageId,
        language: params.language,
        region: params.region || "global",
        marketplace: params.marketplace,
        sku: params.sku,
      }),
    });

    return await handleResponse<GenerateProductTextResponse>(res);
  } catch (error) {
    if (error instanceof ImageToTextApiError) {
      throw error;
    }
    throw new ImageToTextApiError(
      `Could not connect to FastAPI backend at ${IMAGE_TO_TEXT_BASE_URL}. Please ensure the server is running.`,
      0
    );
  }
}

/**
 * Get translations for an image
 */
export async function getTranslations(
  imageId: string,
  language?: string
): Promise<TranslationsResponse> {
  const url = `${IMAGE_TO_TEXT_BASE_URL}/image-to-text/translations/${imageId}${
    language ? `?language=${language}` : ""
  }`;

  try {
    const res = await fetch(url);
    return await handleResponse<TranslationsResponse>(res);
  } catch (error) {
    if (error instanceof ImageToTextApiError) {
      throw error;
    }
    throw new ImageToTextApiError(
      `Could not connect to FastAPI backend at ${IMAGE_TO_TEXT_BASE_URL}. Please ensure the server is running.`,
      0
    );
  }
}

/**
 * Get quality check for an image
 */
export async function getQualityCheck(
  imageId: string
): Promise<QualityCheckResponse> {
  const url = `${IMAGE_TO_TEXT_BASE_URL}/image-to-text/quality-check/${imageId}`;

  try {
    const res = await fetch(url);
    return await handleResponse<QualityCheckResponse>(res);
  } catch (error) {
    if (error instanceof ImageToTextApiError) {
      throw error;
    }
    throw new ImageToTextApiError(
      `Could not connect to FastAPI backend at ${IMAGE_TO_TEXT_BASE_URL}. Please ensure the server is running.`,
      0
    );
  }
}

/**
 * Get KPIs
 */
export async function getKPIs(): Promise<KPIsResponse> {
  const url = `${IMAGE_TO_TEXT_BASE_URL}/image-to-text/kpis`;

  try {
    const res = await fetch(url);
    return await handleResponse<KPIsResponse>(res);
  } catch (error) {
    if (error instanceof ImageToTextApiError) {
      throw error;
    }
    throw new ImageToTextApiError(
      `Could not connect to FastAPI backend at ${IMAGE_TO_TEXT_BASE_URL}. Please ensure the server is running.`,
      0
    );
  }
}

/**
 * Approve translations
 */
export async function approveTranslations(params: {
  imageId: string;
  languages?: string[];
}): Promise<{ success: boolean; approved: number; message: string }> {
  const url = `${IMAGE_TO_TEXT_BASE_URL}/image-to-text/approve`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageId: params.imageId,
        languages: params.languages,
      }),
    });

    return await handleResponse<{ success: boolean; approved: number; message: string }>(res);
  } catch (error) {
    if (error instanceof ImageToTextApiError) {
      throw error;
    }
    throw new ImageToTextApiError(
      `Could not connect to FastAPI backend at ${IMAGE_TO_TEXT_BASE_URL}. Please ensure the server is running.`,
      0
    );
  }
}
