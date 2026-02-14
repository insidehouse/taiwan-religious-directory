import LoginButton from '@/components/auth/LoginButton'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

type LoginPageProps = {
  searchParams: SearchParams
}

function getSingle(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const next = getSingle(params.next) || '/'

  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem' }}>
      <h1>登入</h1>
      <p>收藏功能需要登入。</p>
      <LoginButton next={next} />
    </main>
  )
}
