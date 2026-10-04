/// <reference types="node" />
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import raw from './stages.json'
import { validateStages } from './validate'
import { portraitUrl, stages } from './loader'

const realFileExists = (relPath: string) => existsSync(resolve(process.cwd(), 'public', relPath))
const anyFile = () => true

function makeStage(order: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `stage-${order}`,
    order,
    species: 'Homo testus',
    lived: { fromYearsAgo: 300000, toYearsAgo: 100000, display: 'About 300,000 to 100,000 years ago' },
    description: 'A short description.',
    facts: ['Fact one.', 'Fact two.'],
    heightMeters: { female: 1.5, male: 1.6 },
    images: { female: 'portraits/f.svg', male: 'portraits/m.svg' },
    anatomy: { female: 'Notes.', male: 'Notes.' },
    sources: [{ claim: 'A claim.', url: 'https://example.org/a' }],
    lastChecked: '2026-10-04',
    ...overrides,
  }
}

function errorsFor(overrides: Record<string, unknown>) {
  return validateStages([makeStage(1, overrides)], anyFile)
}

describe('validateStages', () => {
  it('accepts valid stages, with and without optional fields', () => {
    const data = [makeStage(1), makeStage(2, { nickname: 'Nick', punchline: 'Ha.' })]
    expect(validateStages(data, anyFile)).toEqual([])
  })

  it('rejects data that is not a non-empty array', () => {
    expect(validateStages({}, anyFile)).toEqual(['stages: expected an array'])
    expect(validateStages([], anyFile)).toEqual(['stages: expected at least one stage'])
    expect(validateStages([42], anyFile)).toEqual(['stages[0]: expected an object'])
  })

  it.each([
    ['id', { id: 'Not Kebab' }],
    ['species', { species: '' }],
    ['description', { description: '   ' }],
    ['nickname', { nickname: '' }],
    ['punchline', { punchline: 7 }],
    ['lived', { lived: 'long ago' }],
    ['lived.display', { lived: { fromYearsAgo: 2, toYearsAgo: 1, display: '' } }],
    ['lived.fromYearsAgo', { lived: { fromYearsAgo: -1, toYearsAgo: 0, display: 'x' } }],
    ['images', { images: null }],
    ['anatomy.male', { anatomy: { female: 'ok' } }],
    ['lastChecked', { lastChecked: '04/10/2026' }],
  ])('reports a bad %s', (field, overrides) => {
    const errors = errorsFor(overrides)
    expect(errors.some((e) => e.includes(`.${field}`))).toBe(true)
  })

  it('requires 2-3 non-empty facts', () => {
    expect(errorsFor({ facts: ['Only one.'] })).toContain('stages[0] (stage-1).facts: expected 2-3 facts')
    expect(errorsFor({ facts: ['a', 'b', 'c', 'd'] })).toContain('stages[0] (stage-1).facts: expected 2-3 facts')
    expect(errorsFor({ facts: ['a', ''] })).toContain('stages[0] (stage-1).facts[1]: expected a non-empty string')
    expect(errorsFor({ facts: ['a', 'b', 'c'] })).toEqual([])
  })

  it('requires at least one source with an https URL', () => {
    expect(errorsFor({ sources: [] })).toContain('stages[0] (stage-1).sources: expected at least one source')
    expect(errorsFor({ sources: [{ claim: 'x', url: 'http://example.org' }] })).toContain(
      'stages[0] (stage-1).sources[0].url: expected an https URL',
    )
    expect(errorsFor({ sources: [{ claim: '', url: 'not a url' }] })).toHaveLength(2)
  })

  it('rejects ranges that run forwards in time', () => {
    const errors = errorsFor({ lived: { fromYearsAgo: 100, toYearsAgo: 200, display: 'x' } })
    expect(errors).toContain('stages[0] (stage-1).lived: fromYearsAgo must be >= toYearsAgo')
  })

  it('requires heightMeters with both sexes from 0.5 to 2.2 metres', () => {
    const at = 'stages[0] (stage-1).heightMeters'
    expect(errorsFor({ heightMeters: undefined })).toEqual([`${at}: expected an object with female and male`])
    expect(errorsFor({ heightMeters: { female: 1.1 } })).toEqual([`${at}.male: expected a number of metres from 0.5 to 2.2`])
    expect(errorsFor({ heightMeters: { female: '1.1', male: 1.2 } })).toHaveLength(1)
    expect(errorsFor({ heightMeters: { female: 0.4, male: 2.3 } })).toHaveLength(2)
    expect(errorsFor({ heightMeters: { female: Number.NaN, male: 1.2 } })).toHaveLength(1)
    expect(errorsFor({ heightMeters: { female: 0.5, male: 2.2 } })).toEqual([])
  })

  it('rejects impossible ISO dates', () => {
    expect(errorsFor({ lastChecked: '2026-02-30' })).toHaveLength(1)
  })

  it('rejects unknown fields', () => {
    expect(errorsFor({ punchLine: 'typo' })).toContain('stages[0] (stage-1): unknown field "punchLine"')
  })

  it('rejects duplicate ids', () => {
    const errors = validateStages([makeStage(1), makeStage(2, { id: 'stage-1' })], anyFile)
    expect(errors).toContain('stages[1] (stage-1).id: duplicate id')
  })

  it('requires orders to run 1..N without gaps or repeats', () => {
    expect(validateStages([makeStage(1), makeStage(3)], anyFile)).toHaveLength(1)
    expect(validateStages([makeStage(2), makeStage(2, { id: 'other' })], anyFile)).toHaveLength(1)
    expect(validateStages([makeStage(2), makeStage(1)], anyFile)).toEqual([])
  })

  it('checks that image files exist and stay inside public/', () => {
    const errors = validateStages([makeStage(1)], (path) => path !== 'portraits/m.svg')
    expect(errors).toEqual(['stages[0] (stage-1).images.male: file not found: portraits/m.svg'])
    expect(errorsFor({ images: { female: '/abs.svg', male: '../x.svg' } })).toHaveLength(2)
  })
})

describe('stages.json', () => {
  it('passes validation with real image files', () => {
    expect(validateStages(raw, realFileExists)).toEqual([])
  })

  it('has the 10 stages in the spec order', () => {
    expect(stages.map((s) => s.id)).toEqual([
      'homo-sapiens',
      'neanderthal',
      'denisovan',
      'homo-heidelbergensis',
      'homo-erectus',
      'homo-floresiensis',
      'homo-habilis',
      'australopithecus-afarensis',
      'ardipithecus-ramidus',
      'sahelanthropus-tchadensis',
    ])
  })

  it('avoids banned wording in player-facing copy', () => {
    const copy = stages
      .flatMap((s) => [s.species, s.nickname ?? '', s.description, s.punchline ?? '', ...s.facts])
      .join(' ')
    expect(copy).not.toMatch(/primitive|ugly|bachelor|\brose\b|—|H\. longi/i)
  })
})

describe('portraitUrl', () => {
  it('prefixes the base URL', () => {
    expect(portraitUrl('portraits/a.svg')).toBe(`${import.meta.env.BASE_URL}portraits/a.svg`)
    expect(portraitUrl('/portraits/a.svg')).toBe(`${import.meta.env.BASE_URL}portraits/a.svg`)
  })
})
