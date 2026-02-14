import { searchPlaces } from '@/lib/queries/searchPlaces'

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const data = await searchPlaces(url.searchParams)
  return Response.json(data, { status: 200 })
}
