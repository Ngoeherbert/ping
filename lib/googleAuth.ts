import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { authClient } from './authClient';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'ping' });

  const result = await authClient.signIn.social({
    provider: 'google',
    callbackURL: redirectUri,
  });

  return result;
}
