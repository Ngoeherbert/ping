# Ping Deployment Guide

## 1. Neon Database

1. Create a project at [console.neon.tech](https://console.neon.tech).
2. Copy the pooled connection string for serverless deployments.
3. Set `DATABASE_URL` in your runtime environment:

```bash
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/pingdb?sslmode=require
```

4. Run migrations after configuring the environment:

```bash
npx drizzle-kit migrate
```

## 2. Better Auth Secret

Generate a 32+ character secret and set it as `BETTER_AUTH_SECRET`:

```bash
openssl rand -base64 32
```

## 3. Google OAuth

1. Open [console.cloud.google.com](https://console.cloud.google.com).
2. Create or select a project and configure OAuth consent.
3. Create OAuth 2.0 credentials.
4. Add redirect URIs for the hosted API and Expo deep link:
   - `https://your-domain.com/api/auth/callback/google`
   - `ping://`
5. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `EXPO_PUBLIC_GOOGLE_CLIENT_ID`.

## 4. Cloudinary Media Uploads

1. Create a Cloudinary account.
2. Create an unsigned upload preset named `ping_uploads`.
3. Set the server and public Expo variables:

```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ping_uploads
```

## 5. EAS Build and Submit

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios
eas submit --platform android
```

## 6. EAS Secrets

```bash
eas secret:create --scope project --name DATABASE_URL --value "postgresql://..."
eas secret:create --scope project --name BETTER_AUTH_SECRET --value "your-secret"
eas secret:create --scope project --name GOOGLE_CLIENT_ID --value "your-id"
eas secret:create --scope project --name GOOGLE_CLIENT_SECRET --value "your-secret"
```
