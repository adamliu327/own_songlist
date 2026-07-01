export interface RuntimeConfig {
  password?: string;
}

export function getRuntimeConfig(): RuntimeConfig {
  return (window as unknown as { __APP_CONFIG__?: RuntimeConfig }).__APP_CONFIG__ || {};
}
