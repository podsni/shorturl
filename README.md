# 🎯 URL Shortener - Smart Link Management

A modern, feature-rich URL shortener built with Next.js, featuring GitHub sync, admin panel, and automatic deployment integration.

> **👋 First time here?** If you forked this repository, run `./setup.sh` for automatic configuration!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpodsni%2Fshorturl&env=TURSO_DATABASE_URL,TURSO_AUTH_TOKEN,ADMIN_PASSWORD&envDescription=Database%20and%20admin%20configuration&envLink=https%3A%2F%2Fgithub.com%2Fpodsni%2Fshorturl%23configuration&project-name=my-url-shortener&repository-name=my-url-shortener)

## ✨ Features

- 🔗 **Custom Short URLs** - Create branded short links  
- 🎛️ **Admin Panel** - Full management interface
- 🔄 **GitHub Sync** - Bi-directional synchronization
- 🚀 **Auto Deploy** - Seamless Vercel integration
- 📊 **Status Tracking** - Real-time sync monitoring
- 🛡️ **Secure** - Admin authentication & validation
- 📱 **Responsive** - Mobile-friendly design

## 🚀 Quick Start (For Forks)

### 1. Auto Setup (Recommended)
```bash
git clone https://github.com/YOUR_USERNAME/shorturl.git
cd shorturl
./setup.sh
```

### 2. Manual Setup
1. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

2. Install dependencies:
   ```bash
   pnpm install  # or npm install
   ```

3. Configure `.env.local` with your values

4. Set up database:
   ```bash
   pnpm run seed
   ```

5. Deploy to Vercel or your preferred platform

## 🍴 For Fork Users

> **Special Note for Forks:** This repository is designed to be easily forkable! 

### Why Fork This?
- ✅ **Easy Setup**: Auto-configuration script
- ✅ **Your Own Domain**: Use your custom domain  
- ✅ **Full Control**: Modify and customize as needed
- ✅ **Free Hosting**: Deploy on Vercel's free tier
- ✅ **GitHub Sync**: Keep everything in sync automatically

### Fork Setup Process
1. **Fork** this repository to your GitHub account
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/shorturl.git`
3. **Run setup**: `./setup.sh` (handles repository detection automatically)
4. **Configure** your environment variables
5. **Deploy** to Vercel with your custom domain

### What the Setup Script Does
- 🔍 **Auto-detects** your repository information
- 🔧 **Updates** all GitHub API references to your fork
- 📋 **Guides** you through environment setup
- 🚀 **Provides** deployment instructions
- 📚 **Links** to detailed documentation

### Fork-Specific Features
- **Repository Auto-Detection**: Automatically configures for your fork
- **Custom Branding**: Easy to customize for your needs
- **Independent Sync**: Your fork syncs independently
- **Support**: Dedicated issue templates for fork help

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