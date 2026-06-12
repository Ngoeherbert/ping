import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { authClient } from './authClient';

WebBrowser.maybeCompleteAuthSession();

type SocialResult = {
  data?: { url?: string; token?: string; user?: unknown } | null;
  error?: { message?: string } | null;
};

export async function signInWithGoogle() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'ping' });

  const signInSocial = authClient.signIn.social as (payload: Record<string, string>) => Promise<SocialResult>;
  const result = await signInSocial({
    provider: 'google',
    callbackURL: redirectUri,
    newUserCallbackURL: redirectUri,
    errorCallbackURL: redirectUri,
  });

  if (result.error) throw new Error(result.error.message ?? 'Google sign-in failed');

  const authUrl = result.data?.url;
  if (!authUrl) return result;

  const browserResult = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
  if (browserResult.type !== 'success') {
    throw new Error('Google sign-in was cancelled before it completed.');
  }

  return result;
}
