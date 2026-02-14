import type { MetadataRoute } from 'next'
import { getPublishedPlaces } from '@/lib/queries/searchPlaces'

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? 'https://kaohsiung-religious-directory.example'
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getPublishedPlaces().map((place) => ({
    url: `${baseUrl()}/places/${place.slug}`,
    changeFrequency: 'weekly',
    priority: 0.7,
    lastModified: new Date(place.updated_at),
  }))
}
