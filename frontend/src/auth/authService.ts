// Lightweight Cognito auth service using OAuth PKCE flow
// No heavy dependencies like AWS Amplify

import { getAuthConfig, isAuthConfigured } from './config';

interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface UserInfo {
  email: string;
  sub: string;
}

// Storage keys
const STORAGE_KEYS = {
  accessToken: 'accent_access_token',
  idToken: 'accent_id_token',
  refreshToken: 'accent_refresh_token',
  expiresAt: 'accent_expires_at',
  codeVerifier: 'accent_code_verifier',
};

// Generate random string for PKCE
const generateRandomString = (length: number): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomValues, (v) => charset[v % charset.length]).join('');
};

// Create SHA256 hash for PKCE
const sha256 = async (plain: string): Promise<ArrayBuffer> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return await crypto.subtle.digest('SHA-256', data);
};

// Base64 URL encode
const base64UrlEncode = (arrayBuffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// Generate PKCE code verifier and challenge
const generatePKCE = async (): Promise<{ verifier: string; challenge: string }> => {
  const verifier = generateRandomString(64);
  const hashed = await sha256(verifier);
  const challenge = base64UrlEncode(hashed);
  return { verifier, challenge };
};

// Parse JWT payload
const parseJwt = (token: string): Record<string, unknown> => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
};

class AuthService {
  private config = getAuthConfig();

  // Redirect to Cognito hosted UI for login
  async login(): Promise<void> {
    if (!isAuthConfigured()) {
      console.warn('Auth not configured, skipping login');
      return;
    }

    const { verifier, challenge } = await generatePKCE();
    sessionStorage.setItem(STORAGE_KEYS.codeVerifier, verifier);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'email openid profile',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    window.location.href = `${this.config.domain}/login?${params.toString()}`;
  }

  // Handle OAuth callback and exchange code for tokens
  async handleCallback(): Promise<boolean> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      console.error('Auth error:', error, urlParams.get('error_description'));
      return false;
    }

    if (!code) {
      return false;
    }

    const verifier = sessionStorage.getItem(STORAGE_KEYS.codeVerifier);
    if (!verifier) {
      console.error('No code verifier found');
      return false;
    }

    try {
      const tokens = await this.exchangeCodeForTokens(code, verifier);
      this.storeTokens(tokens);
      sessionStorage.removeItem(STORAGE_KEYS.codeVerifier);

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    } catch (err) {
      console.error('Token exchange failed:', err);
      return false;
    }
  }

  // Exchange authorization code for tokens
  private async exchangeCodeForTokens(code: string, verifier: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      code,
      redirect_uri: this.config.redirectUri,
      code_verifier: verifier,
    });

    const response = await fetch(`${this.config.domain}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    return await response.json();
  }

  // Store tokens in localStorage
  private storeTokens(tokens: TokenResponse): void {
    localStorage.setItem(STORAGE_KEYS.accessToken, tokens.access_token);
    localStorage.setItem(STORAGE_KEYS.idToken, tokens.id_token);
    if (tokens.refresh_token) {
      localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refresh_token);
    }
    const expiresAt = Date.now() + tokens.expires_in * 1000;
    localStorage.setItem(STORAGE_KEYS.expiresAt, expiresAt.toString());
  }

  // Get current access token
  getAccessToken(): string | null {
    const expiresAt = localStorage.getItem(STORAGE_KEYS.expiresAt);
    if (expiresAt && Date.now() > parseInt(expiresAt)) {
      // Token expired, try refresh or clear
      this.clearTokens();
      return null;
    }
    return localStorage.getItem(STORAGE_KEYS.accessToken);
  }

  // Get ID token (contains user info)
  getIdToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.idToken);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    if (!isAuthConfigured()) {
      // If auth not configured (local dev), allow access
      return true;
    }
    return !!this.getAccessToken();
  }

  // Get current user info from ID token
  getCurrentUser(): UserInfo | null {
    const idToken = this.getIdToken();
    if (!idToken) return null;

    const payload = parseJwt(idToken);
    return {
      email: payload.email as string,
      sub: payload.sub as string,
    };
  }

  // Logout - clear tokens and redirect to Cognito logout
  logout(): void {
    this.clearTokens();

    if (!isAuthConfigured()) {
      window.location.reload();
      return;
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      logout_uri: this.config.redirectUri,
    });

    window.location.href = `${this.config.domain}/logout?${params.toString()}`;
  }

  // Clear all stored tokens
  private clearTokens(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }
}

export const authService = new AuthService();

