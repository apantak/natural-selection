import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { validateStages } from '../src/content/validate.ts'

const root = new URL('../', import.meta.url)
const stagesPath = fileURLToPath(new URL('src/content/stages.json', root))
const publicDir = new URL('public/', root)

let data: unknown
try {
  data = JSON.parse(readFileSync(stagesPath, 'utf8'))
} catch (error) {
  console.error(`Could not read ${stagesPath}: ${(error as Error).message}`)
  process.exit(1)
}

const errors = validateStages(data, (relPath) => existsSync(fileURLToPath(new URL(relPath, publicDir))))

if (errors.length > 0) {
  console.error(`Content check failed with ${errors.length} error(s):`)
  for (const error of errors) console.error(`  - ${error}`)
  process.exit(1)
}

console.log(`Content OK: ${(data as unknown[]).length} stages`)
