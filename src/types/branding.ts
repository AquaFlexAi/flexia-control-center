export interface BrandingSettings {
  id: string;
  title: string;
  primary_color: string;
  logo_path: string;
  footer_text: string;
  theme: string;
  created_at?: string;
  updated_at?: string;
}

export interface BrandingUpdateRequest {
  title: string;
  primaryColor: string;
  logoPath: string;
  footerText: string;
  theme: string;
}

export interface BrandingResponse {
    success?: boolean;
    data?: BrandingSettings;
    error?: string;
}
