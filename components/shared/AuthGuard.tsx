import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

function needsProfileCompletion(user: ReturnType<typeof useAuthStore.getState>['user']) {
  if (!user) return false;
  return !user.username || !user.name;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading, needsProfileSetup } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const routeName = segments[0];
    const onCompleteProfile = routeName === 'complete-profile';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/onboarding');
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      router.replace(needsProfileSetup || needsProfileCompletion(user) ? '/complete-profile' : '/(tabs)');
      return;
    }

    if (isAuthenticated && (needsProfileSetup || needsProfileCompletion(user)) && !onCompleteProfile) {
      router.replace('/complete-profile');
    }
  }, [isAuthenticated, isLoading, needsProfileSetup, router, segments, user]);

  return <>{children}</>;
}
