# API Documentation - E-Commerce Content Intelligence Platform

This document outlines all API endpoints that need to be implemented in the backend to support the frontend application.

**Status:** ✅ All endpoints are now wired in the frontend using React Query and the API client (`src/lib/api.ts`).

## Base URL
```
BASE_URL = https://api.example.com/api/v1
```

**Environment Variable:** Set `VITE_API_URL` in your `.env` file to configure the API base URL.

All endpoints should support CORS for cross-origin requests from the frontend.

---

## 1. Dashboard APIs

### 1.1 Get Dashboard KPIs
**Endpoint:** `GET /dashboard/kpis`

**Description:** Returns key performance indicators for the dashboard.

**Response:**
```json
{
  "kpis": [
    {
      "title": "Image-Description Mismatch",
      "value": "3.2%",
      "change": -12,
      "icon": "ImageOff",
      "iconColor": "text-destructive"
    },
    {
      "title": "AI Photoshoot Savings",
      "value": "₹18.5L",
      "change": 28,
      "icon": "Camera",
      "iconColor": "text-success"
    },
    {
      "title": "Compliance Score",
      "value": "94/100",
      "change": 5,
      "icon": "ShieldCheck",
      "iconColor": "text-primary"
    },
    {
      "title": "Localization Complete",
      "value": "87%",
      "change": 15,
      "icon": "Languages",
      "iconColor": "text-info"
    },
    {
      "title": "SKU AI-Coverage",
      "value": "92%",
      "change": 8,
      "icon": "Cpu",
      "iconColor": "text-ai"
    },
    {
      "title": "Revenue at Risk",
      "value": "₹2.3Cr",
      "change": -22,
      "icon": "AlertTriangle",
      "iconColor": "text-warning"
    }
  ]
}
```

**Usage in Frontend:** `src/pages/Dashboard.tsx`

---

### 1.2 Get Quality Risk Radar Data
**Endpoint:** `GET /dashboard/quality-risk-radar`

**Query Parameters:**
- `marketplace` (optional): Filter by marketplace (e.g., "Amazon.in", "Flipkart", "Takealot")

**Response:**
```json
{
  "riskData": {
    "Fashion": {
      "Image Mismatch": 85,
      "Attribute Error": 45,
      "Low Resolution": 20,
      "Missing Keywords": 60
    },
    "Beauty": {
      "Image Mismatch": 30,
      "Attribute Error": 70,
      "Low Resolution": 15,
      "Missing Keywords": 40
    },
    "Electronics": {
      "Image Mismatch": 15,
      "Attribute Error": 25,
      "Low Resolution": 80,
      "Missing Keywords": 35
    },
    "Home": {
      "Image Mismatch": 50,
      "Attribute Error": 55,
      "Low Resolution": 30,
      "Missing Keywords": 75
    },
    "Grocery": {
      "Image Mismatch": 25,
      "Attribute Error": 40,
      "Low Resolution": 10,
      "Missing Keywords": 90
    }
  },
  "categories": ["Fashion", "Beauty", "Electronics", "Home", "Grocery"],
  "issueTypes": ["Image Mismatch", "Attribute Error", "Low Resolution", "Missing Keywords"]
}
```

**Usage in Frontend:** `src/components/dashboard/QualityRiskRadar.tsx`

---

### 1.3 Get Photoshoot Performance Data
**Endpoint:** `GET /dashboard/photoshoot-performance`

**Query Parameters:**
- `startDate` (optional): Start date for data range (ISO 8601 format)
- `endDate` (optional): End date for data range (ISO 8601 format)

**Response:**
```json
{
  "costData": [
    { "month": "Jan", "saved": 125000 },
    { "month": "Feb", "saved": 185000 },
    { "month": "Mar", "saved": 220000 },
    { "month": "Apr", "saved": 190000 },
    { "month": "May", "saved": 275000 },
    { "month": "Jun", "saved": 310000 }
  ],
  "rejectionData": [
    { "name": "Amazon", "value": 12, "color": "#b89d7f" },
    { "name": "Flipkart", "value": 8, "color": "#a3825e" },
    { "name": "Takealot", "value": 5, "color": "#896b4a" },
    { "name": "eBay", "value": 15, "color": "#6f563b" }
  ],
  "styleCards": [
    { "name": "Lifestyle", "count": 1247, "trend": "+15%" },
    { "name": "Studio", "count": 892, "trend": "+8%" },
    { "name": "Flat Lay", "count": 634, "trend": "+22%" }
  ]
}
```

**Usage in Frontend:** `src/components/dashboard/PhotoshootPerformance.tsx`

---

### 1.4 Get Real-Time Alerts
**Endpoint:** `GET /dashboard/alerts`

**Query Parameters:**
- `limit` (optional): Number of alerts to return (default: 50)
- `type` (optional): Filter by alert type ("critical", "warning", "info")
- `severity` (optional): Minimum severity level

**Response:**
```json
{
  "alerts": [
    {
      "id": "1",
      "type": "critical",
      "sku": "SKU-8742",
      "message": "Color mismatch detected: Listed as \"Navy Blue\", image shows \"Black\"",
      "marketplace": "Amazon.in",
      "timestamp": "2024-01-15T10:30:00Z",
      "timestampRelative": "2 min ago"
    },
    {
      "id": "2",
      "type": "warning",
      "sku": "SKU-3291",
      "message": "Missing Hindi translation for product description",
      "marketplace": "Flipkart",
      "timestamp": "2024-01-15T10:15:00Z",
      "timestampRelative": "15 min ago"
    }
  ],
  "total": 5,
  "criticalCount": 2,
  "warningCount": 2,
  "infoCount": 1
}
```

**Usage in Frontend:** `src/components/dashboard/AlertsList.tsx`

---

### 1.5 Get Impact Metrics
**Endpoint:** `GET /dashboard/impact-metrics`

**Query Parameters:**
- `period` (optional): Time period ("month", "quarter", "year") - default: "month"

**Response:**
```json
{
  "metrics": [
    {
      "icon": "Clock",
      "value": "2,847",
      "unit": "hrs",
      "label": "Time Saved",
      "description": "This month",
      "gradient": "from-sand-400/20 to-sand-500/20"
    },
    {
      "icon": "DollarSign",
      "value": "₹18.5L",
      "unit": "",
      "label": "Cost Avoided",
      "description": "Photography expenses",
      "gradient": "from-success/10 to-success/20"
    },
    {
      "icon": "Zap",
      "value": "+47%",
      "unit": "",
      "label": "SKU Throughput",
      "description": "vs manual process",
      "gradient": "from-warning/10 to-warning/20"
    },
    {
      "icon": "ShieldCheck",
      "value": "89%",
      "unit": "",
      "label": "Error Reduction",
      "description": "Listing rejections",
      "gradient": "from-info/10 to-info/20"
    }
  ],
  "roi": {
    "percentage": 312,
    "period": "quarter",
    "targetAchievement": 78
  }
}
```

**Usage in Frontend:** `src/components/dashboard/ImpactMetrics.tsx`

---

## 2. Mismatch Engine APIs

### 2.1 Get Mismatch Data
**Endpoint:** `GET /mismatch/list`

**Query Parameters:**
- `search` (optional): Search query for SKU
- `category` (optional): Filter by category ("fashion", "electronics", "home", "beauty", "grocery", "all")
- `brand` (optional): Filter by brand
- `marketplace` (optional): Filter by marketplace (e.g., "amazon", "flipkart", "takealot", "all")
- `language` (optional): Filter by missing language code (e.g., "hi", "ta", "te", "all")
- `region` (optional): Filter by region ("india", "south_africa", "global", "all")
- `issueType` (optional): Filter by issue type ("color", "size", "local", "all")
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `sortBy` (optional): Sort field ("mismatchScore", "impactScore", "listingProb")
- `sortOrder` (optional): Sort order ("asc", "desc")

**Response:**
```json
{
  "data": [
    {
      "sku": "SKU-8742",
      "marketplace": "Amazon.in",
      "mismatchScore": 85,
      "attributeErrors": ["Color", "Size"],
      "localMissing": ["hi", "ta"],
      "category": "Fashion",
      "issueType": "Color Mismatch",
      "listingProb": 45,
      "impactScore": 4.5
    },
    {
      "sku": "SKU-3291",
      "marketplace": "Flipkart",
      "mismatchScore": 42,
      "attributeErrors": ["Material"],
      "localMissing": ["hi"],
      "category": "Home",
      "issueType": "Attribute Error",
      "listingProb": 72,
      "impactScore": 3.2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1247,
    "totalPages": 25
  },
  "filters": {
    "categories": ["Fashion", "Electronics", "Home", "Beauty", "Grocery"],
    "marketplaces": ["Amazon.in", "Flipkart", "Takealot", "eBay"],
    "regions": ["india", "south_africa", "global"]
  }
}
```

**Usage in Frontend:** `src/pages/MismatchEngine.tsx`

---

### 2.2 Get Mismatch KPIs
**Endpoint:** `GET /mismatch/kpis`

**Response:**
```json
{
  "kpis": [
    {
      "label": "Mismatch Rate",
      "value": "3.2%",
      "change": -12,
      "status": "success"
    },
    {
      "label": "Attribute Errors",
      "value": "1,247",
      "change": 8,
      "status": "warning"
    },
    {
      "label": "Localization Coverage",
      "value": "87%",
      "change": 15,
      "status": "success"
    },
    {
      "label": "Rejection Rate",
      "value": "2.1%",
      "change": -5,
      "status": "success"
    },
    {
      "label": "Revenue at Risk",
      "value": "₹2.3Cr",
      "change": -22,
      "status": "warning"
    }
  ]
}
```

**Usage in Frontend:** `src/pages/MismatchEngine.tsx`

---

### 2.3 Get Attribute Comparison for SKU
**Endpoint:** `GET /mismatch/sku/:sku/attributes`

**URL Parameters:**
- `sku`: SKU identifier

**Response:**
```json
{
  "sku": "SKU-8742",
  "comparison": [
    {
      "attribute": "Color",
      "aiDetected": "Navy Blue",
      "marketplaceListing": "Black",
      "match": false,
      "confidence": 98
    },
    {
      "attribute": "Size",
      "aiDetected": "M",
      "marketplaceListing": "L",
      "match": false,
      "confidence": 92
    },
    {
      "attribute": "Pattern",
      "aiDetected": "Solid",
      "marketplaceListing": "Solid",
      "match": true,
      "confidence": 99
    },
    {
      "attribute": "Gender",
      "aiDetected": "Unisex",
      "marketplaceListing": "Unisex",
      "match": true,
      "confidence": 95
    },
    {
      "attribute": "Material",
      "aiDetected": "Cotton Blend",
      "marketplaceListing": "Cotton Blend",
      "match": true,
      "confidence": 91
    }
  ]
}
```

**Usage in Frontend:** `src/pages/MismatchEngine.tsx`

---

### 2.4 Get Localization Status for SKU
**Endpoint:** `GET /mismatch/sku/:sku/localization`

**URL Parameters:**
- `sku`: SKU identifier

**Response:**
```json
{
  "sku": "SKU-8742",
  "localization": {
    "india": {
      "en": { "status": "complete", "completeness": 100 },
      "hi": { "status": "missing", "completeness": 0 },
      "ta": { "status": "missing", "completeness": 0 },
      "te": { "status": "complete", "completeness": 100 },
      "bn": { "status": "complete", "completeness": 100 }
    },
    "south_africa": {
      "en": { "status": "complete", "completeness": 100 },
      "zu": { "status": "missing", "completeness": 0 },
      "af": { "status": "missing", "completeness": 0 },
      "xh": { "status": "complete", "completeness": 100 }
    },
    "global": {
      "en": { "status": "complete", "completeness": 100 },
      "es": { "status": "complete", "completeness": 100 },
      "fr": { "status": "complete", "completeness": 100 },
      "ar": { "status": "pending", "completeness": 45 }
    }
  },
  "missingTranslations": 3,
  "incorrectTranslations": 0,
  "nonCompliantKeywords": 0
}
```

**Usage in Frontend:** `src/pages/MismatchEngine.tsx`

---

### 2.5 Export Mismatch Data
**Endpoint:** `GET /mismatch/export`

**Query Parameters:** Same as `/mismatch/list`

**Response:** CSV or Excel file download

**Usage in Frontend:** `src/pages/MismatchEngine.tsx`

---

### 2.6 Fix Mismatch Issue
**Endpoint:** `POST /mismatch/fix`

**Request Body:**
```json
{
  "sku": "SKU-8742",
  "action": "update_attributes" | "generate_translations" | "regenerate_images",
  "parameters": {
    "attributes": ["Color", "Size"],
    "marketplace": "Amazon.in"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Fix process initiated for SKU-8742",
  "jobId": "job-12345",
  "estimatedTime": "5 minutes"
}
```

**Usage in Frontend:** `src/pages/MismatchEngine.tsx`

---

## 3. AI Photoshoot APIs

### 3.1 Get Photoshoot KPIs
**Endpoint:** `GET /photoshoot/kpis`

**Response:**
```json
{
  "kpis": [
    {
      "label": "Photos Generated Today",
      "value": "1,847",
      "icon": "Camera",
      "change": 12
    },
    {
      "label": "Avg Rendering Time",
      "value": "4.2s",
      "icon": "Clock",
      "change": -18
    },
    {
      "label": "Cost Saved Today",
      "value": "₹2.8L",
      "icon": "DollarSign",
      "change": 24
    },
    {
      "label": "Approval Rate",
      "value": "94%",
      "icon": "CheckCircle",
      "change": 3
    },
    {
      "label": "Diversity Score",
      "value": "87/100",
      "icon": "Users",
      "change": 5
    }
  ]
}
```

**Usage in Frontend:** `src/pages/AIPhotoshoot.tsx`

---

### 3.2 Get Photoshoot Templates
**Endpoint:** `GET /photoshoot/templates`

**Query Parameters:**
- `region` (optional): Filter by region ("indian", "southAfrican", "global")

**Response:**
```json
{
  "indian": [
    {
      "id": 1,
      "name": "Saree Elegance",
      "uses": 4521,
      "image": "Traditional saree pose",
      "previewUrl": "https://cdn.example.com/templates/saree-elegance.jpg"
    },
    {
      "id": 2,
      "name": "Kurta Classic",
      "uses": 3892,
      "image": "Modern kurta style",
      "previewUrl": "https://cdn.example.com/templates/kurta-classic.jpg"
    }
  ],
  "southAfrican": [
    {
      "id": 5,
      "name": "Ubuntu Spirit",
      "uses": 1892,
      "image": "Multi-ethnic models",
      "previewUrl": "https://cdn.example.com/templates/ubuntu-spirit.jpg"
    }
  ],
  "global": [
    {
      "id": 9,
      "name": "Studio Pro",
      "uses": 8934,
      "image": "White background",
      "previewUrl": "https://cdn.example.com/templates/studio-pro.jpg"
    }
  ]
}
```

**Usage in Frontend:** `src/pages/AIPhotoshoot.tsx`

---

### 3.3 Upload Product Image
**Endpoint:** `POST /photoshoot/upload`

**Request:** Multipart form data
- `file`: Image file (JPEG, PNG)
- `sku` (optional): Associated SKU
- `maxSize`: 10MB

**Response:**
```json
{
  "success": true,
  "imageId": "img-12345",
  "url": "https://cdn.example.com/uploads/img-12345.jpg",
  "filename": "product-image.jpg",
  "size": 2048576,
  "dimensions": {
    "width": 1920,
    "height": 1080
  }
}
```

**Usage in Frontend:** `src/pages/AIPhotoshoot.tsx`

---

### 3.4 Generate Photoshoot
**Endpoint:** `POST /photoshoot/generate`

**Request Body:**
```json
{
  "imageId": "img-12345",
  "templateId": 1,
  "skinTone": "#f5d0c5",
  "region": "indian",
  "marketplaces": ["Amazon", "Flipkart"],
  "sku": "SKU-8742"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "job-67890",
  "estimatedTime": "15 seconds",
  "statusUrl": "/photoshoot/status/job-67890"
}
```

**Usage in Frontend:** `src/pages/AIPhotoshoot.tsx`

---

### 3.5 Get Photoshoot Status
**Endpoint:** `GET /photoshoot/status/:jobId`

**URL Parameters:**
- `jobId`: Job identifier

**Response:**
```json
{
  "jobId": "job-67890",
  "status": "processing" | "completed" | "failed",
  "progress": 65,
  "result": {
    "generatedImages": [
      {
        "id": "gen-001",
        "url": "https://cdn.example.com/generated/gen-001.jpg",
        "template": "Saree Elegance",
        "marketplace": "Amazon"
      }
    ]
  },
  "error": null
}
```

**Usage in Frontend:** Polling or WebSocket connection

---

### 3.6 Regenerate Photoshoot
**Endpoint:** `POST /photoshoot/regenerate`

**Request Body:**
```json
{
  "imageId": "img-12345",
  "templateId": 1,
  "skinTone": "#f5d0c5",
  "previousJobId": "job-67890"
}
```

**Response:** Same as `/photoshoot/generate`

**Usage in Frontend:** `src/pages/AIPhotoshoot.tsx`

---

### 3.7 Download Generated Image
**Endpoint:** `GET /photoshoot/download/:imageId`

**URL Parameters:**
- `imageId`: Generated image identifier

**Response:** Image file download

**Usage in Frontend:** `src/pages/AIPhotoshoot.tsx`

---

### 3.8 Get Cost Efficiency Analysis
**Endpoint:** `GET /photoshoot/cost-analysis`

**Query Parameters:**
- `period` (optional): Time period ("day", "month", "quarter", "year")

**Response:**
```json
{
  "regionSavings": [
    {
      "region": "India",
      "saved": "₹12.5L",
      "amount": 1250000,
      "percent": 78
    },
    {
      "region": "South Africa",
      "saved": "R 892K",
      "amount": 892000,
      "percent": 65
    },
    {
      "region": "Global",
      "saved": "$45K",
      "amount": 45000,
      "percent": 82
    }
  ],
  "timeToPublish": {
    "before": 48,
    "after": 12,
    "unit": "hrs"
  },
  "categoryBreakdown": [
    {
      "cat": "Fashion",
      "percent": 45,
      "color": "bg-sand-500"
    },
    {
      "cat": "Beauty",
      "percent": 25,
      "color": "bg-sand-400"
    },
    {
      "cat": "Home",
      "percent": 20,
      "color": "bg-sand-300"
    },
    {
      "cat": "Other",
      "percent": 10,
      "color": "bg-sand-200"
    }
  ]
}
```

**Usage in Frontend:** `src/pages/AIPhotoshoot.tsx`

---

## 4. Image to Text APIs

### 4.1 Get Image-to-Text KPIs
**Endpoint:** `GET /image-to-text/kpis`

**Response:**
```json
{
  "kpis": [
    {
      "label": "Language Completeness",
      "value": "87%",
      "icon": "Languages",
      "change": 12
    },
    {
      "label": "Marketplace Readiness",
      "value": "94/100",
      "icon": "Target",
      "change": 5
    },
    {
      "label": "SEO Quality Score",
      "value": "91/100",
      "icon": "Zap",
      "change": 8
    },
    {
      "label": "Attribute Accuracy",
      "value": "96%",
      "icon": "CheckCircle",
      "change": 3
    },
    {
      "label": "Time Saved/Listing",
      "value": "4.2min",
      "icon": "Clock",
      "change": -22
    }
  ]
}
```

**Usage in Frontend:** `src/pages/ImageToText.tsx`

---

### 4.2 Upload Image for Text Generation
**Endpoint:** `POST /image-to-text/upload`

**Request:** Multipart form data
- `file`: Image file (JPEG, PNG)
- `sku` (optional): Associated SKU
- `maxSize`: 10MB

**Response:**
```json
{
  "success": true,
  "imageId": "img-12345",
  "url": "https://cdn.example.com/uploads/img-12345.jpg",
  "filename": "product-image.jpg"
}
```

**Usage in Frontend:** `src/pages/ImageToText.tsx`

---

### 4.3 Generate Product Description
**Endpoint:** `POST /image-to-text/generate`

**Request Body:**
```json
{
  "imageId": "img-12345",
  "region": "india",
  "language": "en",
  "marketplace": "Amazon.in",
  "sku": "SKU-8742"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "job-11111",
  "title": "Premium Cotton Blend Unisex T-Shirt - Navy Blue | Comfortable Casual Wear",
  "shortDescription": "Elevate your everyday style with this premium cotton blend t-shirt. Features a classic fit, breathable fabric, and versatile navy blue color perfect for any casual occasion.",
  "bulletPoints": [
    "Premium cotton-polyester blend for ultimate comfort",
    "Classic unisex fit suitable for all body types",
    "Easy care - machine washable",
    "Available in sizes S to XXL",
    "Perfect for casual and semi-formal occasions"
  ],
  "attributes": [
    {
      "name": "Color",
      "value": "Navy Blue",
      "confidence": 98
    },
    {
      "name": "Material",
      "value": "Cotton Blend",
      "confidence": 92
    },
    {
      "name": "Gender",
      "value": "Unisex",
      "confidence": 88
    },
    {
      "name": "Size Range",
      "value": "S-XXL",
      "confidence": 95
    },
    {
      "name": "Pattern",
      "value": "Solid",
      "confidence": 99
    },
    {
      "name": "Fit Type",
      "value": "Regular",
      "confidence": 85
    },
    {
      "name": "Occasion",
      "value": "Casual",
      "confidence": 78
    },
    {
      "name": "Care",
      "value": "Machine Wash",
      "confidence": 91
    }
  ]
}
```

**Usage in Frontend:** `src/pages/ImageToText.tsx`

---

### 4.4 Get Translations
**Endpoint:** `GET /image-to-text/translations/:imageId`

**URL Parameters:**
- `imageId`: Image identifier

**Query Parameters:**
- `language` (optional): Filter by language code

**Response:**
```json
{
  "imageId": "img-12345",
  "translations": [
    {
      "code": "en",
      "name": "English",
      "flag": "🇬🇧",
      "status": "complete",
      "title": "Premium Cotton Blend Unisex T-Shirt - Navy Blue",
      "description": "...",
      "bulletPoints": [...]
    },
    {
      "code": "hi",
      "name": "Hindi",
      "flag": "🇮🇳",
      "status": "complete",
      "title": "...",
      "description": "...",
      "bulletPoints": [...]
    },
    {
      "code": "ta",
      "name": "Tamil",
      "flag": "🇮🇳",
      "status": "pending",
      "title": null,
      "description": null,
      "bulletPoints": null
    }
  ]
}
```

**Usage in Frontend:** `src/pages/ImageToText.tsx`

---

### 4.5 Get Localization Quality Check
**Endpoint:** `GET /image-to-text/quality-check/:imageId`

**URL Parameters:**
- `imageId`: Image identifier

**Response:**
```json
{
  "imageId": "img-12345",
  "qualityChecks": [
    {
      "code": "en",
      "name": "English",
      "flag": "🇬🇧",
      "status": "complete",
      "checks": {
        "grammar": true,
        "keywords": 94,
        "cultural": 100,
        "forbidden": true
      }
    },
    {
      "code": "hi",
      "name": "Hindi",
      "flag": "🇮🇳",
      "status": "complete",
      "checks": {
        "grammar": true,
        "keywords": 91,
        "cultural": 98,
        "forbidden": true
      }
    }
  ]
}
```

**Usage in Frontend:** `src/pages/ImageToText.tsx`

---

### 4.6 Approve Translations
**Endpoint:** `POST /image-to-text/approve`

**Request Body:**
```json
{
  "imageId": "img-12345",
  "languages": ["en", "hi", "ta"] // Optional: approve specific languages, omit to approve all
}
```

**Response:**
```json
{
  "success": true,
  "approved": 3,
  "message": "All translations approved successfully"
}
```

**Usage in Frontend:** `src/pages/ImageToText.tsx`

---

## 5. SQL Agent APIs

### 5.1 Submit Natural Language Query
**Endpoint:** `POST /sql-agent/query`

**Request Body:**
```json
{
  "query": "Show mismatched SKUs for Amazon.in last 2 days",
  "market": "india"
}
```

**Response:**
```json
{
  "success": true,
  "queryId": "query-22222",
  "sql": "SELECT sku, marketplace, issue_type, revenue_at_risk FROM content_issues WHERE market = 'india' AND marketplace = 'Amazon.in' AND created_at >= NOW() - INTERVAL '2 days' ORDER BY revenue_at_risk DESC",
  "results": [
    {
      "sku": "SKU-8742",
      "marketplace": "Amazon.in",
      "issue": "Color Mismatch",
      "risk": "₹45,000"
    },
    {
      "sku": "SKU-3291",
      "marketplace": "Amazon.in",
      "issue": "Missing Translation",
      "risk": "₹32,000"
    }
  ],
  "rowCount": 5,
  "executionTime": "0.234s"
}
```

**Usage in Frontend:** `src/pages/SQLAgent.tsx`

---

### 5.2 Get Recent Queries
**Endpoint:** `GET /sql-agent/recent-queries`

**Query Parameters:**
- `limit` (optional): Number of recent queries (default: 10)

**Response:**
```json
{
  "queries": [
    {
      "id": "query-11111",
      "query": "Show top 10 SKUs by revenue at risk",
      "time": "2024-01-15T09:30:00Z",
      "timeRelative": "5 min ago"
    },
    {
      "id": "query-22222",
      "query": "Which categories have highest mismatch rate?",
      "time": "2024-01-15T09:15:00Z",
      "timeRelative": "12 min ago"
    }
  ]
}
```

**Usage in Frontend:** `src/pages/SQLAgent.tsx`

---

### 5.3 Get Example Queries
**Endpoint:** `GET /sql-agent/examples`

**Response:**
```json
{
  "examples": [
    "Show mismatched SKUs for Amazon.in last 2 days",
    "Which listings failed Takealot compliance?",
    "How much photoshoot cost saved in India this month?",
    "Generate Flipkart-ready content for this image",
    "List SKUs with missing localized content in South Africa"
  ]
}
```

**Usage in Frontend:** `src/pages/SQLAgent.tsx`

---

### 5.4 Visualize Query Results
**Endpoint:** `POST /sql-agent/visualize`

**Request Body:**
```json
{
  "queryId": "query-22222",
  "chartType": "bar" | "line" | "pie" | "table"
}
```

**Response:**
```json
{
  "success": true,
  "chartData": {
    "type": "bar",
    "data": [...],
    "config": {...}
  }
}
```

**Usage in Frontend:** `src/pages/SQLAgent.tsx`

---

### 5.5 Export Query Results
**Endpoint:** `GET /sql-agent/export/:queryId`

**URL Parameters:**
- `queryId`: Query identifier

**Query Parameters:**
- `format` (optional): Export format ("csv", "excel", "json") - default: "csv"

**Response:** File download

**Usage in Frontend:** `src/pages/SQLAgent.tsx`

---

## 6. Settings APIs

### 6.1 Get User Settings
**Endpoint:** `GET /settings`

**Response:**
```json
{
  "profile": {
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://cdn.example.com/avatars/john.jpg"
  },
  "notifications": {
    "email": true,
    "push": false,
    "alerts": ["critical", "warning"]
  },
  "marketplaces": [
    {
      "id": "amazon-in",
      "name": "Amazon.in",
      "active": true,
      "connected": true
    },
    {
      "id": "flipkart",
      "name": "Flipkart",
      "active": true,
      "connected": true
    }
  ],
  "appearance": {
    "theme": "system" | "light" | "dark"
  }
}
```

**Usage in Frontend:** `src/pages/Settings.tsx`

---

### 6.2 Update User Settings
**Endpoint:** `PUT /settings`

**Request Body:**
```json
{
  "profile": {
    "name": "John Doe"
  },
  "notifications": {
    "email": true
  },
  "appearance": {
    "theme": "dark"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

---

## Error Responses

All endpoints should return errors in the following format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

**Common HTTP Status Codes:**
- `200 OK`: Success
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation errors
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

---

## Authentication

All endpoints (except public ones) should require authentication via:

**Header:**
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Rate Limiting

Consider implementing rate limiting:
- **Dashboard APIs**: 100 requests/minute
- **Mismatch APIs**: 60 requests/minute
- **Photoshoot APIs**: 30 requests/minute
- **Image-to-Text APIs**: 30 requests/minute
- **SQL Agent APIs**: 20 requests/minute

---

## WebSocket Support (Optional)

For real-time updates, consider WebSocket connections:
- **Dashboard Alerts**: Real-time alert notifications
- **Photoshoot Generation**: Progress updates
- **Image-to-Text Processing**: Status updates

**WebSocket URL:** `wss://api.example.com/ws`

---

## Notes for Backend Implementation

1. **Image Storage**: Use a CDN or object storage service (AWS S3, Cloudinary, etc.) for image uploads and generated content.

2. **Job Queue**: Use a job queue system (Redis Queue, Celery, Bull, etc.) for long-running tasks like:
   - Photoshoot generation
   - Image-to-text processing
   - Bulk data exports

3. **Caching**: Implement caching for frequently accessed data:
   - Dashboard KPIs (cache for 5 minutes)
   - Template lists (cache for 1 hour)
   - Recent queries (cache for 1 minute)

4. **Database Schema**: Design tables for:
   - SKUs and products
   - Marketplace listings
   - Mismatch issues
   - Photoshoot jobs and results
   - Generated content
   - Translations
   - User queries and history

5. **File Upload Limits**: 
   - Maximum file size: 10MB
   - Supported formats: JPEG, PNG
   - Image dimensions: Validate min/max dimensions

6. **Pagination**: All list endpoints should support pagination with page and limit parameters.

7. **Filtering & Sorting**: Implement comprehensive filtering and sorting capabilities for data tables.

