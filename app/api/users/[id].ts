export function GET(_request: Request, { id }: { id: string }) {
  return Response.json({ data: { id } });
}
