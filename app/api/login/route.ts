function normalizeNext(value: FormDataEntryValue | null): string {
  const raw = typeof value === 'string' ? value : '/'
  if (!raw.startsWith('/')) return '/'
  return raw
}

export async function POST(req: Request): Promise<Response> {
  const formData = await req.formData()
  const next = normalizeNext(formData.get('next'))
  const redirectUrl = new URL(next, req.url)

  return new Response(null, {
    status: 303,
    headers: {
      Location: redirectUrl.toString(),
      'Set-Cookie': 'mock_session=1; Path=/; HttpOnly; SameSite=Lax',
    },
  })
}
