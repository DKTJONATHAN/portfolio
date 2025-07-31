import { inject as injectAnalytics } from '@vercel/analytics';
import { inject as injectSpeedInsights } from '@vercel/speed-insights';

// Inject Web Analytics for visitor tracking
injectAnalytics();

// Inject Speed Insights for performance tracking
injectSpeedInsights();