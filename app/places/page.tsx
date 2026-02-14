import PlaceFilters from '@/components/places/PlaceFilters'
import PlaceList from '@/components/places/PlaceList'
import { searchPlaces } from '@/lib/queries/searchPlaces'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

type PlacesPageProps = {
  searchParams: SearchParams
}

function getSingle(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

export default async function PlacesPage({ searchParams }: PlacesPageProps) {
  const params = await searchParams
  const district = getSingle(params.district)
  const keyword = getSingle(params.keyword)
  const religionType = getSingle(params.religion_type)

  const query = new URLSearchParams({
    district,
    keyword,
    religion_type: religionType,
  })

  const data = await searchPlaces(query)

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem' }}>
      <h1>高雄宗教場所搜尋</h1>
      <PlaceFilters district={district} keyword={keyword} religionType={religionType} />
      <PlaceList items={data.items} total={data.total} />
    </main>
  )
}
