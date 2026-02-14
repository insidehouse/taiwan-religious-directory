type LoginButtonProps = {
  next: string
}

export default function LoginButton({ next }: LoginButtonProps) {
  return (
    <form action="/api/login" method="post">
      <input type="hidden" name="next" value={next} />
      <button type="submit">使用 Google 登入</button>
    </form>
  )
}
