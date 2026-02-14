type FavoriteButtonProps = {
  placeId: string
  currentPath: string
}

export default function FavoriteButton({ placeId, currentPath }: FavoriteButtonProps) {
  return (
    <form action="/api/favorites" method="post" style={{ marginTop: '1rem' }}>
      <input type="hidden" name="placeId" value={placeId} />
      <input type="hidden" name="currentPath" value={currentPath} />
      <button type="submit">收藏</button>
    </form>
  )
}
