/**
 * Auto-configuration helper for forked repositories
 * This file helps detect and configure repository settings automatically
 */

export interface RepositoryConfig {
  owner: string;
  name: string;
  fullName: string;
  isOriginal: boolean;
}

export function detectRepository(): RepositoryConfig {
  // Try to detect from environment variables first
  const envRepo = process.env.GITHUB_REPOSITORY;
  if (envRepo) {
    const [owner, name] = envRepo.split('/');
    return {
      owner,
      name,
      fullName: envRepo,
      isOriginal: envRepo === 'podsni/shorturl'
    };
  }

  // Fallback to package.json or default
  const defaultRepo = 'podsni/shorturl';
  const [owner, name] = defaultRepo.split('/');
  
  return {
    owner,
    name,
    fullName: defaultRepo,
    isOriginal: true
  };
}

export function getGitHubApiUrl(endpoint: string = ''): string {
  const repo = detectRepository();
  return `https://api.github.com/repos/${repo.fullName}${endpoint}`;
}

export function getRepositoryUrl(): string {
  const repo = detectRepository();
  return `https://github.com/${repo.fullName}`;
}

// Helper to show fork-specific messages
export function getForkMessage(): string | null {
  const repo = detectRepository();
  
  if (!repo.isOriginal) {
    return `🍴 This is a fork of podsni/shorturl. Original: https://github.com/podsni/shorturl`;
  }
  
  return null;
}
