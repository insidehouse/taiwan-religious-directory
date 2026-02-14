function normalizePath(value: FormDataEntryValue | null): string {
  const raw = typeof value === 'string' ? value : ''
  if (!raw.startsWith('/')) return '/'
  return raw
}

function hasSession(cookieHeader: string | null): boolean {
  return Boolean(cookieHeader && cookieHeader.includes('mock_session=1'))
}

export async function POST(req: Request): Promise<Response> {
  const formData = await req.formData()
  const currentPath = normalizePath(formData.get('currentPath'))

  if (!hasSession(req.headers.get('cookie'))) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', currentPath)
    return Response.redirect(loginUrl, 302)
  }

  const returnUrl = new URL(currentPath, req.url)
  returnUrl.searchParams.set('favorited', '1')
  return Response.redirect(returnUrl, 303)
}
