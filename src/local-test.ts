/**
 * Local preview of the PR comment — no GitHub token or PR context needed.
 *
 * Usage:
 *   npm run local-test
 *   npm run local-test -- --new    src/client.ts,src/format.ts \
 *                          --modified src/coverage.ts,src/scorePr.ts \
 *                          --file ./coverage.xml \
 *                          --sha abc1234
 *
 * Without flags every file in the report is treated as a modified file.
 */
import fs from 'fs'
import {parseAverageCoverage, parseFilesCoverage, parseSources} from './coverage'
import {buildCommentBody} from './build-comment-body'

// --- arg parsing -----------------------------------------------------------

function flag(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`)
  return idx !== -1 ? process.argv[idx + 1] : undefined
}

function flagList(name: string): string[] | undefined {
  const val = flag(name)
  return val ? val.split(',').map(s => s.trim()) : undefined
}

const reportPath = flag('file') ?? './coverage.xml'
const sha = flag('sha') ?? 'local'
const report = fs.readFileSync(reportPath, 'utf8')
const sources = parseSources(report)

// Discover all filenames in the report when not supplied via flags.
// Filenames in the XML already include the package subfolder (e.g. package1/client.ts)
// so we return them as-is; parseFilesCoverage strips the source prefix when looking them up.
function allFilenames(): string[] {
  const fileRegex = /filename="([^"]+)"/g
  const names: string[] = []
  let match: RegExpExecArray | null
  while ((match = fileRegex.exec(report)) !== null) {
    names.push(match[1])
  }
  return names
}

const newFiles = flagList('new')
const modifiedFiles = flagList('modified') ?? allFilenames()

// --- build coverage data ---------------------------------------------------

const threshold = 0
const averageCover = parseAverageCoverage(report, threshold)
const newCover = newFiles ? (parseFilesCoverage(report, sources, newFiles, threshold) ?? []) : []
const modifiedCover = parseFilesCoverage(report, sources, modifiedFiles, threshold) ?? []

// --- render ----------------------------------------------------------------

const {body, passOverall} = buildCommentBody({averageCover, newCover, modifiedCover, sources}, sha)

// eslint-disable-next-line no-console
console.log(body)
// eslint-disable-next-line no-console
console.log('\n---')
// eslint-disable-next-line no-console
console.log(`Overall pass: ${passOverall}`)
