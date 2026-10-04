export interface StageSource {
  claim: string
  url: string
}

export interface Stage {
  id: string
  order: number
  species: string
  nickname?: string
  lived: {
    fromYearsAgo: number
    toYearsAgo: number
    display: string
  }
  description: string
  facts: string[]
  punchline?: string
  heightMeters: {
    female: number
    male: number
  }
  images: {
    female: string
    male: string
  }
  anatomy: {
    female: string
    male: string
  }
  sources: StageSource[]
  lastChecked: string
}
