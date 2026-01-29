const GITHUB_REPO = 'https://github.com/dachrisch/energy.consumption';

export function getVersion(): string {
  return import.meta.env.VITE_BUILD_VERSION || 'dev';
}

export function getVersionLink(): string {
  const version = getVersion();
  if (version === 'dev') {
    return GITHUB_REPO;
  }
  // Version tags typically look like "v3.7.1" or "3.7.1"
  const tag = version.startsWith('v') ? version : `v${version}`;
  return `${GITHUB_REPO}/releases/tag/${tag}`;
}

export function isDevVersion(): boolean {
  return getVersion() === 'dev';
}
