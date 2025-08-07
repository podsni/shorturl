/**
 * Utility function untuk trigger GitHub Actions
 */

export async function triggerGitHubSync() {
  try {
    const response = await fetch(`https://api.github.com/repos/localan/shortener/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'sync-redirects',
        client_payload: {
          triggered_by: 'api_link_update',
          timestamp: new Date().toISOString()
        }
      })
    });

    if (response.ok) {
      console.log('✅ GitHub Action triggered successfully');
      return true;
    } else {
      console.error('❌ Failed to trigger GitHub Action:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error triggering GitHub Action:', error);
    return false;
  }
}

export async function triggerVercelDeploy() {
  try {
    // Trigger Vercel deploy hook if available
    const deployHook = process.env.VERCEL_DEPLOY_HOOK;
    if (deployHook) {
      const response = await fetch(deployHook, { method: 'POST' });
      if (response.ok) {
        console.log('✅ Vercel deployment triggered');
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('❌ Error triggering Vercel deploy:', error);
    return false;
  }
}
