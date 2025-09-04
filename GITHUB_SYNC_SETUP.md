# GitHub Sync Configuration Guide

Panduan ini menjelaskan cara mengatur sinkronisasi GitHub untuk URL Shortener agar frontend dan workflow tetap sinkron.

## 🔧 Setup Lengkap

### 1. Environment Variables

Copy `.env.example` ke `.env.local` dan isi dengan nilai yang benar:

```bash
cp .env.example .env.local
```

**Required Environment Variables:**
- `GITHUB_TOKEN`: Personal Access Token dengan permission `repo` dan `actions`
- `TURSO_DATABASE_URL`: URL database Turso
- `TURSO_AUTH_TOKEN`: Auth token Turso
- `ADMIN_PASSWORD`: Password untuk akses admin panel

### 2. GitHub Personal Access Token

1. Pergi ke GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token dengan permissions:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
3. Copy token ke environment variable `GITHUB_TOKEN`

### 3. GitHub Repository Secrets

Tambahkan secrets berikut di repository settings:
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `GITHUB_TOKEN` (optional, jika ingin override default token)

### 4. GitHub Webhook (Optional)

Untuk bi-directional sync, setup webhook di repository:
1. Repository Settings → Webhooks → Add webhook
2. Payload URL: `https://your-domain.com/api/github-sync`
3. Content type: `application/json`
4. Events: `Push events`

## 🔄 Cara Kerja Sinkronisasi

### Frontend → GitHub
1. **Manual Sync**: Button "GitHub Sync" di admin panel
2. **Auto Sync**: Otomatis trigger setelah approve/delete/update link
3. **Workflow**: Memanggil GitHub Action untuk sync database ke `vercel.json`

### GitHub → Frontend
1. **Webhook**: Deteksi perubahan `redirects.json` di repository
2. **Auto Import**: Import data dari GitHub ke database
3. **Bi-directional**: Sinkronisasi dua arah secara otomatis

## 🚀 Workflow GitHub Actions

File: `.github/workflows/sync-redirects.yml`

**Trigger:**
- Push ke branch `main` (path: `app/**`, `lib/**`, `scripts/**`)
- Manual trigger (`workflow_dispatch`)
- Repository dispatch (`sync-redirects`)

**Process:**
1. Install dependencies
2. Sync database to `vercel.json`
3. Commit dan push changes (jika ada)
4. Trigger Vercel deployment

## 📋 API Endpoints

### GitHub Sync API
- `GET /api/github-sync`: Import dari GitHub ke database
- `POST /api/github-sync`: Webhook handler
- `PUT /api/github-sync`: Manual trigger GitHub Action

### Admin API (Auto-sync enabled)
- `POST /api/admin/links`: Create link (draft)
- `PATCH /api/admin/links`: Approve link → auto-sync
- `PUT /api/admin/links/[id]`: Update link → auto-sync
- `DELETE /api/admin/links/[id]`: Delete link → auto-sync

## 🔍 Status Monitoring

### Frontend Status Indicator
- ✅ Sync berhasil dengan timestamp
- ❌ Sync gagal dengan timestamp
- 🔄 Loading state saat sync berlangsung

### Log Monitoring
- Check console logs untuk debug
- GitHub Actions logs untuk workflow
- Vercel deployment logs

## 🛠️ Troubleshooting

### Sync Gagal
1. **Check GitHub Token**: Pastikan token valid dan memiliki permission
2. **Check Repository**: Pastikan nama repository benar di konfigurasi
3. **Check Environment**: Pastikan semua env variables terisi
4. **Check Logs**: Lihat GitHub Actions logs untuk detail error

### Webhook Tidak Berfungsi
1. **Check URL**: Pastikan webhook URL benar
2. **Check SSL**: Pastikan webhook endpoint menggunakan HTTPS
3. **Check Events**: Pastikan "Push events" enabled
4. **Check Payload**: Test webhook dengan Recent Deliveries

### Database Sync Issues
1. **Check Database Connection**: Test koneksi Turso
2. **Check SQL Queries**: Pastikan schema database sesuai
3. **Check Status**: Pastikan link status = 'published' untuk sync

## 📈 Best Practices

1. **Regular Monitoring**: Check sync status secara berkala
2. **Backup Data**: Backup database sebelum deploy besar
3. **Test Sync**: Test sync di environment staging dulu
4. **Monitor Quotas**: Monitor GitHub Actions usage
5. **Security**: Rotate tokens secara berkala

## 🔗 Link Status Workflow

```
Draft → Published → Synced
  ↓        ↓         ↓
Create   Approve   GitHub Action
```

- **Draft**: Link baru, belum live
- **Published**: Approved untuk sync
- **Synced**: Sudah tersync ke `vercel.json`

## 🚀 Deployment

Setelah setup selesai:
1. Deploy ke Vercel
2. Test manual sync di admin panel
3. Test create/approve/delete link
4. Monitor GitHub Actions
5. Verify redirects berfungsi

---

**Repository**: podsni/shorturl  
**Current Setup**: ✅ GitHub Sync Enabled
