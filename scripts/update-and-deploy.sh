#!/bin/bash

echo "🔄 Updating vercel.json with latest redirects..."

# Update vercel.json via API
curl -X POST https://link.dwx.my.id/api/vercel-sync

echo "📦 Building project..."
pnpm build

echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🔗 All redirects are now live via Vercel native redirects"
