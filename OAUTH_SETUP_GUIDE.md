# 📱 Hướng Dẫn Lấy OAuth Credentials - Tất Cả Nền Tảng

## 📋 Mục Lục
1. TikTok
2. Facebook
3. YouTube
4. Instagram

---

## 1️⃣ TIKTOK

### Bước 1: Tạo TikTok Developer Account
1. Truy cập: https://developers.tiktok.com/
2. Click "Sign up"
3. Đăng nhập hoặc tạo TikTok account
4. Xác minh email

### Bước 2: Tạo Application
1. Vào Dashboard
2. Click "Create an app"
3. Chọn "Web"
4. Điền thông tin:
   - **App name**: Flowboard
   - **App description**: Video scheduling tool
   - **App category**: Productivity
5. Click "Create"

### Bước 3: Lấy Credentials
1. Vào app settings
2. Tìm phần "App credentials"
3. Copy:
   - **Client ID** → `TIKTOK_CLIENT_ID`
   - **Client Secret** → `TIKTOK_CLIENT_SECRET`

### Bước 4: Cấu Hình Redirect URI
1. Vào "Redirect URIs"
2. Click "Add"
3. Thêm: `http://localhost:8101/api/social/oauth/tiktok/callback`
4. Save

### Bước 5: Yêu Cầu Permissions
1. Vào "Scopes"
2. Chọn:
   - `user.info.basic` (lấy thông tin user)
   - `video.list` (liệt kê video)
   - `video.upload` (upload video)
3. Save

### ✅ Kết Quả
```
TIKTOK_CLIENT_ID=your_client_id
TIKTOK_CLIENT_SECRET=your_client_secret
TIKTOK_REDIRECT_URI=http://localhost:8101/api/social/oauth/tiktok/callback
```

---

## 2️⃣ FACEBOOK

### Bước 1: Tạo Facebook Developer Account
1. Truy cập: https://developers.facebook.com/
2. Click "Get Started"
3. Đăng nhập Facebook account
4. Xác minh email

### Bước 2: Tạo Application
1. Vào "My Apps"
2. Click "Create App"
3. Chọn "Consumer"
4. Điền thông tin:
   - **App name**: Flowboard
   - **App contact email**: your_email@example.com
   - **App purpose**: Manage pages and post content
5. Click "Create App"

### Bước 3: Lấy App Credentials
1. Vào "Settings" → "Basic"
2. Copy:
   - **App ID** → `FACEBOOK_CLIENT_ID`
   - **App Secret** → `FACEBOOK_CLIENT_SECRET`

### Bước 4: Cấu Hình OAuth
1. Vào "Settings" → "Basic"
2. Tìm "App Domains"
3. Thêm: `localhost`
4. Vào "Products" → "Facebook Login" → "Settings"
5. Thêm Redirect URIs:
   - `http://localhost:8101/api/social/oauth/facebook/callback`
6. Save

### Bước 5: Lấy Page Access Token
1. Vào "Tools" → "Graph API Explorer"
2. Chọn app của bạn
3. Chọn "Get User Access Token"
4. Chọn permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
5. Click "Generate Access Token"
6. Copy token tạm thời

### Bước 6: Lấy Page ID & Page Access Token
1. Chạy query:
```
GET /me/accounts
```
2. Kết quả sẽ hiển thị:
```json
{
  "data": [
    {
      "access_token": "EAAX9vI...",
      "category": "App Page",
      "category_list": [...],
      "name": "Đậu Đậu Review",
      "id": "987602457761028"
    }
  ]
}
```

### ✅ Kết Quả
```
# OAuth Credentials
FACEBOOK_CLIENT_ID=your_app_id
FACEBOOK_CLIENT_SECRET=your_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:8101/api/social/oauth/facebook/callback

# Page Credentials
FB_PAGE_ID=987602457761028
FB_PAGE_NAME=Đậu Đậu Review
FB_PAGE_ACCESS_TOKEN=EAAX9vI...
```

---

## 3️⃣ YOUTUBE

### Bước 1: Tạo Google Cloud Project
1. Truy cập: https://console.cloud.google.com/
2. Click "Select a Project" → "New Project"
3. Điền:
   - **Project name**: Flowboard
4. Click "Create"
5. Chờ project được tạo

### Bước 2: Bật YouTube API
1. Vào "APIs & Services" → "Library"
2. Tìm "YouTube Data API v3"
3. Click vào
4. Click "Enable"

### Bước 3: Tạo OAuth Credentials
1. Vào "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Chọn "Web application"
4. Điền:
   - **Name**: Flowboard
   - **Authorized JavaScript origins**: `http://localhost:8101`
   - **Authorized redirect URIs**: `http://localhost:8101/api/social/oauth/youtube/callback`
5. Click "Create"

### Bước 4: Lấy Credentials
1. Click vào credential vừa tạo
2. Copy:
   - **Client ID** → `YOUTUBE_CLIENT_ID`
   - **Client Secret** → `YOUTUBE_CLIENT_SECRET`

### ✅ Kết Quả
```
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:8101/api/social/oauth/youtube/callback
```

---

## 4️⃣ INSTAGRAM

### Bước 1: Tạo Facebook Developer Account (nếu chưa có)
1. Truy cập: https://developers.facebook.com/
2. Làm theo hướng dẫn Facebook ở trên

### Bước 2: Tạo Instagram Business Account
1. Vào Facebook Page của bạn
2. Settings → "Instagram"
3. Click "Connect Account"
4. Chọn hoặc tạo Instagram Business Account
5. Connect

### Bước 3: Lấy Instagram Credentials
1. Vào "Tools" → "Graph API Explorer"
2. Chạy query:
```
GET /me/instagram_business_account
```
3. Kết quả:
```json
{
  "instagram_business_account": {
    "id": "17841406338772345"
  }
}
```

### Bước 4: Lấy Instagram Access Token
1. Chạy query:
```
GET /me/accounts?fields=access_token
```
2. Copy access token

### ✅ Kết Quả
```
# OAuth Credentials (dùng Facebook)
INSTAGRAM_CLIENT_ID=your_facebook_app_id
INSTAGRAM_CLIENT_SECRET=your_facebook_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:8101/api/social/oauth/instagram/callback

# Instagram Business Account
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841406338772345
INSTAGRAM_ACCESS_TOKEN=EAAX9vI...
```

---

## 📝 Tóm Tắt Tất Cả Credentials

Sau khi hoàn thành, bạn sẽ có:

```
# TikTok
TIKTOK_CLIENT_ID=...
TIKTOK_CLIENT_SECRET=...

# Facebook
FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...
FB_PAGE_ID=...
FB_PAGE_ACCESS_TOKEN=...

# YouTube
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...

# Instagram
INSTAGRAM_CLIENT_ID=...
INSTAGRAM_CLIENT_SECRET=...
INSTAGRAM_BUSINESS_ACCOUNT_ID=...
INSTAGRAM_ACCESS_TOKEN=...
```

---

## ⚠️ Lưu Ý Bảo Mật

1. **KHÔNG bao giờ share credentials** trên GitHub
2. **Giữ bí mật** Client Secret
3. **Rotate tokens** định kỳ
4. **Sử dụng .env file** để lưu credentials
5. **Thêm .env vào .gitignore**

---

## 🆘 Troubleshooting

### TikTok
- **Lỗi**: "Invalid redirect URI"
  - **Giải pháp**: Kiểm tra redirect URI match chính xác

### Facebook
- **Lỗi**: "App not set up"
  - **Giải pháp**: Bật Facebook Login product

### YouTube
- **Lỗi**: "API not enabled"
  - **Giải pháp**: Vào APIs & Services → Enable YouTube Data API v3

### Instagram
- **Lỗi**: "Business account not found"
  - **Giải pháp**: Chuyển Instagram account sang Business Account

---

## ✅ Kiểm Tra

Sau khi có tất cả credentials:
1. Thêm vào `.env` file
2. Start backend: `python -m flowboard.main`
3. Start frontend: `npm run dev`
4. Test OAuth flow cho từng platform
5. Verify account được lưu vào database

**Hoàn tất!** 🎉
