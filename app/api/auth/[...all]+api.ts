import { auth } from '@/lib/auth';
export const GET = (req: Request) => {
  return auth.handler(req);
};

export const POST = (req: Request) => {
  return auth.handler(req);
};
