// ═══════════════════════════════════════════════════════════
// SurakshaAI — Frontend API Client
// Typed fetch wrappers for all backend endpoints
// ═══════════════════════════════════════════════════════════
export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://suraksha-ai-8g47.onrender.com";

const API_BASE = `${BACKEND_URL}/api/v1`;

// ── Types ──────────────────────────────────────────────────

export interface AnalyzeCallResult {
  risk_percentage: number;
  confidence_score: number;
  recommendation: string;
  reasons: string[];
}

export interface CurrencyScanResult {
  is_genuine: boolean;
  confidence: number;
  anomalies: string[];
  bounding_boxes: { x: number; y: number; w: number; h: number; label: string }[];
}

export interface TextCheckResult {
  is_safe: boolean;
  risk_level: string;
  analysis: string;
}

export interface FraudReportResult {
  status: string;
  report_id: string;
  message: string;
}

export interface NetworkGraph {
  nodes: { id: string; label: string; group: number }[];
  links: { source: string; target: string; value: string }[];
}

export interface Hotspot {
  lat: number;
  lng: number;
  intensity: number;
  category: string;
}

// ── Helper ─────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const controller = new AbortController();
    // 60-second timeout to accommodate Render free-tier cold starts (~30s wake time)
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[SurakshaAI API] ${path}:`, err);
    return null;
  }
}

// ── Endpoints ──────────────────────────────────────────────

/** Module 1 — Digital Arrest Scam Detection */
export async function analyzeCall(transcript: string): Promise<AnalyzeCallResult | null> {
  return apiFetch<AnalyzeCallResult>("/scam/analyze-call", {
    method: "POST",
    body: JSON.stringify({ audio_url: "", transcript }),
  });
}

/** Module 2 — Counterfeit Currency Detection */
export async function scanCurrency(imageBase64: string, denomination: number): Promise<CurrencyScanResult | null> {
  return apiFetch<CurrencyScanResult>("/currency/scan", {
    method: "POST",
    body: JSON.stringify({ image_base64: imageBase64, denomination }),
  });
}

/** Module 6 — URL/SMS Phishing Check */
export async function checkText(text: string): Promise<TextCheckResult | null> {
  return apiFetch<TextCheckResult>("/scam/check-text", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

/** Module 7 — Fraud Reporting */
export async function submitReport(
  category: string,
  description: string,
  contact?: string
): Promise<FraudReportResult | null> {
  return apiFetch<FraudReportResult>("/reports/submit", {
    method: "POST",
    body: JSON.stringify({ category, description, contact }),
  });
}

/** Module 4 — Network Graph */
export async function getNetworkGraph(): Promise<NetworkGraph | null> {
  return apiFetch<NetworkGraph>("/intelligence/network-graph");
}

/** Module 5 — Geospatial Hotspots */
export async function getHotspots(): Promise<Hotspot[] | null> {
  return apiFetch<Hotspot[]>("/intelligence/hotspots");
}

// ═══════════════════════════════════════════════════════════
// Module — Website & Phishing Detection
// ═══════════════════════════════════════════════════════════

export interface SSLInfo {
  valid: boolean;
  issuer?: string;
  subject?: string;
  expires?: string;
  days_remaining?: number;
}

export interface WhoisInfo {
  registrar?: string;
  creation_date?: string;
  expiration_date?: string;
  domain_age_days?: number;
  country?: string;
}

export interface DNSInfo {
  ip_addresses: string[];
  mx_records: string[];
  ns_records: string[];
  uses_ip_directly: boolean;
}

export interface ThreatIndicator {
  name: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  detected: boolean;
}

export interface WebsiteAnalysisResult {
  analysis_id: string;
  url: string;
  domain: string;
  prediction: "Legitimate" | "Suspicious" | "Phishing";
  confidence: number;
  risk_level: "Low" | "Medium" | "High" | "Critical";
  risk_score: number;
  ssl: SSLInfo;
  whois: WhoisInfo;
  dns: DNSInfo;
  features: Record<string, any>;
  detected_keywords: string[];
  threats: ThreatIndicator[];
  recommendations: string[];
  processing_time_ms: number;
}

export interface AnalysisHistoryItem {
  analysis_id: string;
  url: string;
  domain: string;
  prediction: string;
  risk_level: string;
  confidence: number;
  created_at: string;
}

export interface WebsiteHistoryItem {
  analysis_id: string;
  url: string;
  domain: string;
  prediction: string;
  risk_level: string;
  confidence: number;
  created_at: string;
}

export interface WebsiteHistoryResponse {
  total: number;
  items: WebsiteHistoryItem[];
}

export async function analyzeWebsite(
  url: string
): Promise<WebsiteAnalysisResult | null> {
  return apiFetch<WebsiteAnalysisResult>("/website/analyze", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

export async function analyzeWebsiteScreenshot(
  imageBase64: string,
  filename?: string
): Promise<WebsiteAnalysisResult | null> {
  return apiFetch<WebsiteAnalysisResult>("/website/screenshot", {
    method: "POST",
    body: JSON.stringify({ 
      image_base64: imageBase64,
      filename: filename ?? "screenshot.png"
    }),
  });
}

export async function getWebsiteHistory(
  limit = 50,
  offset = 0
): Promise<WebsiteHistoryResponse | null> {
  return apiFetch<WebsiteHistoryResponse>(
    `/website/history?limit=${limit}&offset=${offset}`
  );
}

export async function deleteWebsiteAnalysis(
  analysisId: string
): Promise<{ status: string; analysis_id: string } | null> {
  return apiFetch(`/website/${analysisId}`, { method: "DELETE" });
}

// ═══════════════════════════════════════════════════════════
// Module — Counterfeit Currency Detection
// ═══════════════════════════════════════════════════════════

export interface SecurityFeatureResult {
  feature_key: string;
  feature_label: string;
  detected: boolean;
  confidence: number;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
}

export interface ImageQualityInfo {
  resolution: string;
  is_blurry: boolean;
  brightness_ok: boolean;
  rotation_corrected: boolean;
  enhancement_applied: boolean;
}

export interface CurrencyBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

export interface CurrencyAnalysisResult {
  analysis_id: string;
  prediction: "Genuine" | "Counterfeit" | "Inconclusive";
  confidence: number;
  risk_level: "Low" | "Medium" | "High" | "Critical";
  denomination?: number;
  denomination_confidence: number;
  security_features: SecurityFeatureResult[];
  detected_features: string[];
  missing_features: string[];
  features_passed: number;
  features_failed: number;
  total_features: number;
  image_quality: ImageQualityInfo;
  bounding_boxes: CurrencyBoundingBox[];
  explanation: string;
  recommendation: string;
  processing_time_ms: number;
}

export interface CurrencyHistoryItem {
  analysis_id: string;
  denomination?: number;
  prediction: string;
  confidence: number;
  risk_level: string;
  features_passed: number;
  features_failed: number;
  created_at: string;
}

export interface CurrencyHistoryResponse {
  total: number;
  items: CurrencyHistoryItem[];
}

export async function analyzeCurrency(
  imageBase64: string,
  denomination?: number,
  filename?: string
): Promise<CurrencyAnalysisResult | null> {
  return apiFetch<CurrencyAnalysisResult>("/currency/analyze", {
    method: "POST",
    body: JSON.stringify({
      image_base64: imageBase64,
      denomination: denomination ?? null,
      filename: filename ?? "note.jpg",
    }),
  });
}

export async function analyzeCurrencyCamera(
  imageBase64: string,
  denomination?: number
): Promise<CurrencyAnalysisResult | null> {
  return apiFetch<CurrencyAnalysisResult>("/currency/camera", {
    method: "POST",
    body: JSON.stringify({
      image_base64: imageBase64,
      denomination: denomination ?? null,
      filename: "camera_capture.jpg",
    }),
  });
}

export async function getCurrencyHistory(
  limit = 50,
  offset = 0
): Promise<CurrencyHistoryResponse | null> {
  return apiFetch<CurrencyHistoryResponse>(
    `/currency/history?limit=${limit}&offset=${offset}`
  );
}

export async function deleteCurrencyAnalysis(
  analysisId: string
): Promise<{ status: string; analysis_id: string } | null> {
  return apiFetch(`/currency/${analysisId}`, { method: "DELETE" });
}

export async function getSupportedDenominations(): Promise<{
  supported: number[];
  currency: string;
  issuer: string;
} | null> {
  return apiFetch("/currency/denominations");
}

// ═══════════════════════════════════════════════════════════
// Module — QR Code Fraud Detection
// ═══════════════════════════════════════════════════════════

export interface QRAnalysisResult {
  analysis_id: string;
  qr_type: string;
  decoded_content: string;
  prediction: "Safe" | "Suspicious" | "Malicious" | "Unreadable";
  confidence: number;
  risk_level: "Low" | "Medium" | "High" | "Critical";
  merchant_name?: string;
  upi_id?: string;
  threats: ThreatIndicator[];
  recommendation: string;
  processing_time_ms: number;
}

export interface QRHistoryItem {
  analysis_id: string;
  qr_type: string;
  prediction: string;
  confidence: number;
  risk_level: string;
  created_at: string;
}

export interface QRHistoryResponse {
  total: number;
  items: QRHistoryItem[];
}

export async function analyzeQRImage(
  imageBase64: string,
  filename?: string
): Promise<QRAnalysisResult | null> {
  return apiFetch<QRAnalysisResult>("/qr/analyze", {
    method: "POST",
    body: JSON.stringify({
      image_base64: imageBase64,
      filename: filename ?? "qr_code.png",
    }),
  });
}

export async function analyzeQRScan(
  imageBase64: string
): Promise<QRAnalysisResult | null> {
  return apiFetch<QRAnalysisResult>("/qr/scan", {
    method: "POST",
    body: JSON.stringify({
      image_base64: imageBase64,
      filename: "camera_capture.png",
    }),
  });
}

export async function getQRHistory(
  limit = 50,
  offset = 0
): Promise<QRHistoryResponse | null> {
  return apiFetch<QRHistoryResponse>(`/qr/history?limit=${limit}&offset=${offset}`);
}

export async function deleteQRAnalysis(
  analysisId: string
): Promise<{ status: string; analysis_id: string } | null> {
  return apiFetch(`/qr/${analysisId}`, { method: "DELETE" });
}
