export type MvpGateInput = {
  publishedPlaces: number
  requiredCoverage: number
}

export type MvpGateResult = {
  pass: boolean
  reasons: string[]
}

export async function evaluateMvpGate(input: MvpGateInput): Promise<MvpGateResult> {
  const reasons: string[] = []

  if (input.publishedPlaces < 2000) {
    reasons.push(`publishedPlaces below threshold: ${input.publishedPlaces} < 2000`)
  }

  if (input.requiredCoverage < 0.95) {
    reasons.push(`requiredCoverage below threshold: ${input.requiredCoverage} < 0.95`)
  }

  return {
    pass: reasons.length === 0,
    reasons,
  }
}
