// Public CORS proxies that can bypass mixed content and IPTV restrictions
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
];

let currentProxyIndex = 0;

export function getProxiedUrl(url: string): string {
  // Don't proxy HTTPS URLs
  if (url.startsWith('https://')) {
    return url;
  }
  
  // Use current proxy
  const proxy = CORS_PROXIES[currentProxyIndex];
  return `${proxy}${encodeURIComponent(url)}`;
}

export function rotateProxy(): void {
  currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
}

export function getCurrentProxy(): string {
  return CORS_PROXIES[currentProxyIndex];
}
