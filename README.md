# URL Shortener

A modern, clean, and minimal URL shortener built with Next.js 15 and Turso database.

## Features

- 🔗 Clean URL shortening with custom paths
- 📱 Responsive, minimal design
- 🛡️ Admin panel with authentication
- 🗄️ Turso (libSQL) database for persistence
- ⚡ Built with Next.js 15 and TypeScript
- 🎨 Tailwind CSS for styling

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Database**: Turso (libSQL)
- **Styling**: Tailwind CSS
- **Icons**: Font Awesome
- **Deployment**: Vercel

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