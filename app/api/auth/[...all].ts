import { auth } from '@/lib/auth';
import type { APIRoute } from 'expo-router/server';

export const GET: APIRoute = (req) => {
  return auth.handler(req);
};

export const POST: APIRoute = (req) => {
  return auth.handler(req);
};
