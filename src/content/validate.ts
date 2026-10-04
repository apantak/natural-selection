type Rec = Record<string, unknown>

const STAGE_KEYS = [
  'id',
  'order',
  'species',
  'nickname',
  'lived',
  'description',
  'facts',
  'punchline',
  'heightMeters',
  'images',
  'anatomy',
  'sources',
  'lastChecked',
]
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const MIN_HEIGHT = 0.5
const MAX_HEIGHT = 2.2

function isRecord(value: unknown): value is Rec {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isYears(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isIsoDate(value: unknown): boolean {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

function isHttpsUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function checkSexPair(
  value: unknown,
  path: string,
  errors: string[],
  fileExists?: (relPath: string) => boolean,
): void {
  if (!isRecord(value)) {
    errors.push(`${path}: expected an object with female and male`)
    return
  }
  for (const sex of ['female', 'male']) {
    const entry = value[sex]
    if (!isText(entry)) errors.push(`${path}.${sex}: expected a non-empty string`)
    else if (fileExists && (entry.startsWith('/') || entry.split('/').includes('..'))) {
      errors.push(`${path}.${sex}: expected a path relative to public/`)
    } else if (fileExists && !fileExists(entry)) errors.push(`${path}.${sex}: file not found: ${entry}`)
  }
}

function checkHeights(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path}: expected an object with female and male`)
    return
  }
  for (const sex of ['female', 'male']) {
    const height = value[sex]
    if (typeof height !== 'number' || !Number.isFinite(height) || height < MIN_HEIGHT || height > MAX_HEIGHT) {
      errors.push(`${path}.${sex}: expected a number of metres from ${MIN_HEIGHT} to ${MAX_HEIGHT}`)
    }
  }
}

function checkStage(stage: Rec, at: string, errors: string[], fileExists: (relPath: string) => boolean): void {
  for (const key of Object.keys(stage)) {
    if (!STAGE_KEYS.includes(key)) errors.push(`${at}: unknown field "${key}"`)
  }

  if (!isText(stage.id) || !ID_PATTERN.test(stage.id)) errors.push(`${at}.id: expected a kebab-case string`)
  if (!Number.isInteger(stage.order)) errors.push(`${at}.order: expected an integer`)
  if (!isText(stage.species)) errors.push(`${at}.species: expected a non-empty string`)
  if (stage.nickname !== undefined && !isText(stage.nickname)) errors.push(`${at}.nickname: expected a non-empty string`)
  if (!isText(stage.description)) errors.push(`${at}.description: expected a non-empty string`)
  if (stage.punchline !== undefined && !isText(stage.punchline)) errors.push(`${at}.punchline: expected a non-empty string`)
  if (!isIsoDate(stage.lastChecked)) errors.push(`${at}.lastChecked: expected an ISO date (YYYY-MM-DD)`)

  const lived = stage.lived
  if (!isRecord(lived)) {
    errors.push(`${at}.lived: expected an object`)
  } else {
    if (!isYears(lived.fromYearsAgo)) errors.push(`${at}.lived.fromYearsAgo: expected a non-negative number`)
    if (!isYears(lived.toYearsAgo)) errors.push(`${at}.lived.toYearsAgo: expected a non-negative number`)
    if (isYears(lived.fromYearsAgo) && isYears(lived.toYearsAgo) && lived.fromYearsAgo < lived.toYearsAgo) {
      errors.push(`${at}.lived: fromYearsAgo must be >= toYearsAgo`)
    }
    if (!isText(lived.display)) errors.push(`${at}.lived.display: expected a non-empty string`)
  }

  const facts = stage.facts
  if (!Array.isArray(facts) || facts.length < 2 || facts.length > 3) {
    errors.push(`${at}.facts: expected 2-3 facts`)
  } else {
    facts.forEach((fact, i) => {
      if (!isText(fact)) errors.push(`${at}.facts[${i}]: expected a non-empty string`)
    })
  }

  checkHeights(stage.heightMeters, `${at}.heightMeters`, errors)
  checkSexPair(stage.images, `${at}.images`, errors, fileExists)
  checkSexPair(stage.anatomy, `${at}.anatomy`, errors)

  const sources = stage.sources
  if (!Array.isArray(sources) || sources.length === 0) {
    errors.push(`${at}.sources: expected at least one source`)
  } else {
    sources.forEach((source: unknown, i) => {
      if (!isRecord(source)) {
        errors.push(`${at}.sources[${i}]: expected an object`)
        return
      }
      if (!isText(source.claim)) errors.push(`${at}.sources[${i}].claim: expected a non-empty string`)
      if (!isHttpsUrl(source.url)) errors.push(`${at}.sources[${i}].url: expected an https URL`)
    })
  }
}

/**
 * Checks raw stage data against the Stage contract and returns readable errors (empty when valid).
 * @param fileExists Resolves image paths relative to public/.
 */
export function validateStages(data: unknown, fileExists: (relPath: string) => boolean): string[] {
  if (!Array.isArray(data)) return ['stages: expected an array']
  if (data.length === 0) return ['stages: expected at least one stage']

  const errors: string[] = []
  const ids = new Set<string>()
  const orders: number[] = []

  data.forEach((stage: unknown, i) => {
    if (!isRecord(stage)) {
      errors.push(`stages[${i}]: expected an object`)
      return
    }
    const at = isText(stage.id) ? `stages[${i}] (${stage.id})` : `stages[${i}]`
    checkStage(stage, at, errors, fileExists)
    if (isText(stage.id)) {
      if (ids.has(stage.id)) errors.push(`${at}.id: duplicate id`)
      ids.add(stage.id)
    }
    if (Number.isInteger(stage.order)) orders.push(stage.order as number)
  })

  const sorted = [...orders].sort((a, b) => a - b)
  if (sorted.length === data.length && sorted.some((order, i) => order !== i + 1)) {
    errors.push(`stages: orders must be 1..${data.length} with no gaps or repeats (got ${sorted.join(', ')})`)
  }

  return errors
}
