import type { MetadataRoute } from 'next'

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? 'https://kaohsiung-religious-directory.example'
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${baseUrl()}/sitemap.xml`,
  }
}
