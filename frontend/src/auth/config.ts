// Cognito configuration
// These values will be populated after Terraform deployment

export interface AuthConfig {
  userPoolId: string;
  clientId: string;
  domain: string;
  redirectUri: string;
  region: string;
}

// Get config from environment or window config (injected at build/runtime)
export const getAuthConfig = (): AuthConfig => {
  // For local development, use environment variables or defaults
  // For production, these come from the build process
  const config: AuthConfig = {
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
    domain: import.meta.env.VITE_COGNITO_DOMAIN || '',
    redirectUri: import.meta.env.VITE_REDIRECT_URI || window.location.origin,
    region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  };

  return config;
};

// Check if auth is configured (for graceful degradation in dev mode)
export const isAuthConfigured = (): boolean => {
  const config = getAuthConfig();
  return !!(config.userPoolId && config.clientId && config.domain);
};

