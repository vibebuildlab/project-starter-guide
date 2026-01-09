module.exports = {
  ci: {
    collect: {
      // Collect URLs - default to localhost for most projects
      url: ['http://localhost:3000'],
      // For static sites, you might want to build first
      staticDistDir: './dist',
      // Number of runs for more accurate results
      numberOfRuns: 3,
      // Wait for page to be ready
      settings: {
        chromeFlags: '--no-sandbox --headless --disable-gpu',
      },
    },
    assert: {
      // Performance budgets - configurable thresholds
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        // Specific metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        // Accessibility checks
        'color-contrast': 'error',
        'meta-description': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        // SEO essentials
        canonical: 'warn',
        'meta-viewport': 'error',
        'structured-data': 'warn',
      },
    },
    upload: {
      // Store results - can be configured per project
      target: 'temporary-public-storage',
      // For teams: configure GitHub status checks
      // githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN,
    },
  },
}
