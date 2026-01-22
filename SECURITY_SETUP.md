# 🔒 Security Setup Guide

## ⚠️ IMPORTANT: Firebase API Key Security

Your Firebase credentials have been removed from the public repository. However, **the old credentials were exposed on GitHub**.

### 🚨 CRITICAL NEXT STEPS:

#### 1. **Rotate Your Firebase API Keys (HIGHLY RECOMMENDED)**

Since your Firebase credentials were publicly exposed, you should rotate them:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `fleshflowapp`
3. Go to **Project Settings** (gear icon)
4. Navigate to **Service Accounts** tab
5. Click **Generate New Private Key** to create new credentials
6. Update your `.env` file with the new credentials

#### 2. **Restrict Your Firebase API Key**

Even if you don't rotate, you MUST restrict your API key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `fleshflowapp`
3. Navigate to **APIs & Services** → **Credentials**
4. Find your API key and click **Edit**
5. Under **Application restrictions**, select:
   - **HTTP referrers (websites)** for frontend
   - **IP addresses** for backend
6. Add your allowed domains/IPs:
   - `localhost:*` (for development)
   - Your production domain (e.g., `yourdomain.com`)
   - Your backend server IP

#### 3. **Enable Firebase Security Rules**

Protect your Firestore database:

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Products are read-only for all, write for admins only
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Orders can be read by the user who created them
    match /orders/{orderId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
  }
}
```

---

## 📝 Environment Variables Setup

### For Local Development:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase credentials in `.env`:
   ```env
   FIREBASE_API_KEY=your_actual_api_key
   FIREBASE_AUTH_DOMAIN=your_auth_domain
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   FIREBASE_DATABASE_URL=your_database_url
   ```

3. **NEVER commit `.env` to Git** - it's already in `.gitignore`

### For Production (Render/Vercel):

Add these environment variables in your hosting platform's dashboard:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_DATABASE_URL`

---

## ✅ Security Checklist

- [ ] Rotated Firebase API keys (or restricted them)
- [ ] Added API key restrictions in Google Cloud Console
- [ ] Configured Firestore Security Rules
- [ ] Set up environment variables locally
- [ ] Configured environment variables in production
- [ ] Verified `.env` is in `.gitignore`
- [ ] Confirmed `firebaseConfig.js` no longer contains hardcoded credentials

---

## 🔍 How to Verify Security

1. **Check GitHub**: Visit your repository and confirm `firebaseConfig.js` doesn't show hardcoded credentials
2. **Test Locally**: Run `npm start` and verify the app connects to Firebase
3. **Monitor Firebase**: Check Firebase Console for any suspicious activity

---

## 📚 Additional Resources

- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/basics)
- [Securing API Keys](https://cloud.google.com/docs/authentication/api-keys)
- [Environment Variables in Node.js](https://nodejs.dev/learn/how-to-read-environment-variables-from-nodejs)
