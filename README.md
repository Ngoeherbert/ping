# Ping

Ping is an Expo Router social app scaffold with a React Native client, API routes, Drizzle/Postgres schema, Better Auth integration, media uploads, push notifications, messaging, stories, reels, privacy controls, and in-chat mini games.

## Tech Stack

- **Mobile app:** Expo SDK 54, React 19.1, React Native 0.81.4, Expo Router 6
- **State:** Zustand stores under `store/`
- **Database:** Postgres via Drizzle ORM and Neon serverless
- **Auth:** Better Auth with email/password and Google OAuth plumbing
- **Media:** Cloudinary unsigned uploads, `expo-video` reels playback, and Expo Media Library/File System for story downloads
- **Notifications:** Expo Notifications with server-side push token registration
- **Assets:** Text-based generator for local Expo image assets and Inter fonts installed through `@expo-google-fonts/inter`

## Getting Started

### 1. Install dependencies

```bash
npm install
```

The dependency set is upgraded for Expo SDK 54 and pins React Native peer packages to SDK-compatible ranges. In particular, `react-native` is set to `0.81.4` and `react-native-screens` is pinned to `~4.16.0`, avoiding the earlier install conflict where npm selected `react-native-screens@4.25.x` with a `react-native >=0.82.0` peer requirement.

If your local machine still has a stale dependency graph, remove old install artifacts and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

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

## Assets and Fonts

Binary files are intentionally not committed to keep the repository reviewable in environments that do not support binary diffs. Instead, `scripts/generate-assets.js` creates the Expo PNG assets locally.

```bash
npm run assets:generate
```

`npm install` also runs the generator through `postinstall`, so a fresh checkout will create the required `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png`, `assets/favicon.png`, and bundled `assets/images/*` copies after dependencies install.

Inter fonts are installed from `@expo-google-fonts/inter` and wired through the `expo-font` config plugin in `app.json`, which avoids committing font binaries to this repo.

## Useful Scripts

| Command | Description |
| --- | --- |
| `npm run start` | Start the Expo dev server |
| `npm run ios` | Start Expo for iOS |
| `npm run android` | Start Expo for Android |
| `npm run web` | Start Expo for web |
| `npm run typecheck` | Run TypeScript with `tsc --noEmit` |
| `npm run assets:generate` | Generate local Expo PNG image assets |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply Drizzle migrations |
| `npm run db:studio` | Open Drizzle Studio |

## Project Structure

```text
app/                  Expo Router screens and API routes
assets/               Generated asset placeholders and asset-generation notes
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
- Push notifications require a physical device and a development build; the app skips push registration in Expo Go to avoid SDK 54 Expo Go notification limitations.
- Mini game sessions are synchronized by polling the `game_sessions` table through `/api/games/[id]`.

## SDK 54 Runtime Notes

- Server endpoints under `app/api` use Expo Router `+api` files so they are not treated as client screens by the native router.
- Reels use `expo-video` instead of deprecated `expo-av`.
- If you see a Worklets version mismatch after upgrading, clear Metro with `npm run start -- --reset-cache` or `npx expo start -c` after reinstalling dependencies.
