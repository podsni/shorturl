# 🔗 Simple URL Shortener with Vercel

A simple and powerful URL shortener built with Next.js and Vercel redirects. Transform long URLs into short, shareable links using Vercel's native redirect system.

## 🚀 How It Works

This URL shortener leverages **Vercel's redirect feature** to create short URLs without needing a complex backend. When someone visits your short URL, Vercel handles the redirect automatically using `307 Temporary Redirect` status codes.

### Example Usage

Instead of sharing:
```
https://someawesomesite.com/blog/working-with-new-suspense-system-in-react-17
```

You can create and share:
```
https://yourdomain.com/react-suspense
```

## � Features

- **Vercel Native Redirects** - Ultra-fast redirects handled at CDN level
- **Database Management** - Store and manage links via admin panel
- **Auto-sync** - GitHub Actions automatically update `vercel.json`
- **Hybrid System** - Database + Static + Native redirects for reliability
- **Admin Panel** - Web interface to manage all your short links
- **External & Internal** - Redirect to any URL (internal pages or external sites)

## 🛠 Configuration

The magic happens in `vercel.json`:

```json
{
  "redirects": [
    {
      "source": "/gh",
      "destination": "https://github.com/username",
      "permanent": false
    },
    {
      "source": "/blog-post",
      "destination": "/blog/very-long-article-title-here",
      "permanent": false
    }
  ]
}
```

### Redirect Options

- **source**: The short path (e.g., `/gh`, `/docs`)
- **destination**: Target URL (internal or external)
- **permanent**: `false` = 307 (temporary), `true` = 308 (permanent)

## Getting Started

1. Clone the repository:
```bash
git clone git@github.com:localan/shortener.git
cd shortener
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Add your Turso database credentials:
```env
TURSO_DATABASE_URL=your_database_url
TURSO_AUTH_TOKEN=your_auth_token
ADMIN_PASSWORD=your_admin_password
```

4. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Deployment

This project is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Usage

### Creating Short Links

1. Go to the Admin panel
2. Enter admin password
3. Add new links with source path and destination URL
4. Optional: Add title and description

### Accessing Short Links

Visit `yourdomain.com/yourpath` to be redirected to the destination URL.

## License

MIT License