# Ping

Ping is an Expo Router social app scaffold with a React Native client, API routes, Drizzle/Postgres schema, Better Auth integration, media uploads, push notifications, messaging, stories, reels, privacy controls, and in-chat mini games.

## Tech Stack

- **Mobile app:** Expo SDK 52, React Native 0.76, Expo Router 4
- **State:** Zustand stores under `store/`
- **Database:** Postgres via Drizzle ORM and Neon serverless
- **Auth:** Better Auth with email/password and Google OAuth plumbing
- **Media:** Cloudinary unsigned uploads, Expo Media Library/File System for story downloads
- **Notifications:** Expo Notifications with server-side push token registration

## Getting Started

### 1. Install dependencies

```bash
npm install
```

This project pins `react-native-screens` to an Expo SDK 52 / React Native 0.76 compatible version. If you previously hit an `ERESOLVE` error mentioning `react-native-screens@4.25.x` requiring `react-native >=0.82.0`, pull the latest `package.json` and rerun `npm install`.

### 2. Configure environment variables

Copy the example file and fill in your local values:

```bash
cp .env.example .env
```

Required values include:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `EXPO_PUBLIC_API_URL`
- Google OAuth credentials, if using Google sign-in
- Cloudinary values, if using media uploads

### 3. Run database migrations

```bash
npm run db:generate
npm run db:migrate
```

### 4. Start the app

```bash
npm run start
```

Then choose an Expo target from the CLI, or run directly:

```bash
npm run ios
npm run android
npm run web
```

## Useful Scripts

| Command | Description |
| --- | --- |
| `npm run start` | Start the Expo dev server |
| `npm run ios` | Start Expo for iOS |
| `npm run android` | Start Expo for Android |
| `npm run web` | Start Expo for web |
| `npm run typecheck` | Run TypeScript with `tsc --noEmit` |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply Drizzle migrations |
| `npm run db:studio` | Open Drizzle Studio |

## Project Structure

```text
app/                  Expo Router screens and API routes
components/           Reusable feed, story, game, and UI components
db/                   Drizzle schema and database client
lib/                  Auth, API middleware, constants, upload and notification utilities
store/                Zustand stores for app state
types/                Shared TypeScript interfaces
eas.json              EAS build configuration
DEPLOYMENT.md         Deployment setup guide
```

## Notes for Development

- API routes use `requireAuth` from `lib/apiMiddleware.ts`; test authenticated flows with a valid session.
- Story download requires a device or simulator with media-library permissions.
- Push notifications require a physical device for token registration.
- Mini game sessions are synchronized by polling the `game_sessions` table through `/api/games/[id]`.
