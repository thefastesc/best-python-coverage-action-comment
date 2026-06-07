import * as core from '@actions/core'

import {CommitsComparison} from './compareCommits'

// Nobody writes classes in TS, just stick to basic jsons and use typescripts types
export type Coverage = {
  cover: number
  file: string
  pass: boolean
}

export type AverageCoverage = {
  ratio: number
  covered: number
  total: number
  pass: boolean
  threshold: number
}

export type FilesCoverage = {
  averageCover: AverageCoverage
  newCover?: Coverage[]
  modifiedCover?: Coverage[]
  sources: string[]
}

export function parseCoverageReport(report: string, files: CommitsComparison): FilesCoverage {
  const threshAll = parseFloat(core.getInput('thresholdAll'))
  const avgCover = parseAverageCoverage(report, threshAll)

  const sourceDirInput = core.getInput('sourceDir')
  const sources: string[] = sourceDirInput ? [sourceDirInput] : parseSources(report)
  const threshModified = parseFloat(core.getInput('thresholdModified'))
  const modifiedCover = parseFilesCoverage(report, sources, files.modifiedFiles, threshModified)

  const threshNew = parseFloat(core.getInput('thresholdNew'))
  const newCover = parseFilesCoverage(report, sources, files.newFiles, threshNew)
  return {averageCover: avgCover, newCover, modifiedCover, sources}
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&')
}

export function parseFilesCoverage(
  report: string,
  sources: string[],
  files: string[] | undefined,
  threshold: number
): Coverage[] | undefined {
  const coverages = files?.map(file => {
    // Try matching the full path first (filename already contains the source prefix),
    // then fall back to stripping each source prefix for reports that omit it.
    const candidates = [file, ...sources.map(source => file.replace(`${source}/`, ''))]
    let cover = -1
    for (const candidate of candidates) {
      const fileName = escapeRegExp(candidate)
      const lineRegex = new RegExp(`^.*filename="${fileName}".*$`, 'gm')
      const lineMatches = [...report.matchAll(lineRegex)]
      const coverRegex = new RegExp('line-rate="(?<cover>[0-9]+\.?[0-9]*)"')
      for (const lineMatch of lineMatches) {
        const coverMatch = lineMatch[0].match(coverRegex)
        if (coverMatch?.groups) {
          cover = parseFloat(coverMatch.groups['cover'])
          break
        }
      }
      if (cover >= 0) break
    }
    return {file, cover, pass: cover >= threshold}
  })
  return coverages?.filter(cover => cover.cover >= 0)
}

export function parseSources(report: string): string[] {
  const regex = new RegExp(`<source>(?<source>[^<]+)</source>`, 'g')
  const sources: string[] = []
  for (const match of report.matchAll(regex)) {
    if (match.groups) {
      sources.push(match.groups['source'].replace(`${process.cwd()}/`, ''))
    }
  }
  if (sources.length === 0) {
    core.setFailed('❌ could not parse source from coverage report - make sure the xml report is valid')
    return []
  }
  return sources
}

function setFailed(): AverageCoverage {
  core.setFailed('❌ could not parse total coverage - make sure xml report is valid')
  return {ratio: -1, covered: -1, threshold: -1, total: -1, pass: false}
}

export function parseAverageCoverage(report: string, threshold: number): AverageCoverage {
  const lineRegex = new RegExp('.*<coverage.*>', 'g')
  const totalRegex = new RegExp('.*lines-valid="(?<total>[\\d.]+)".*')
  const coveredRegex = new RegExp('.*lines-covered="(?<covered>[\\d.]+)".*')
  const coverageLineRegex = new RegExp('line-rate="(?<ratio>[\\d.]+)"')

  const matches = [...report.matchAll(lineRegex)]
  let result = null
  if (matches.length === 1) {
    const line = matches[0][0]
    const totalMatch = line.match(totalRegex)
    const coveredMatch = line.match(coveredRegex)
    const ratioMatch = line.match(coverageLineRegex)

    if (totalMatch?.groups && coveredMatch?.groups && ratioMatch?.groups) {
      const total = parseFloat(totalMatch.groups['total'])
      const covered = parseFloat(coveredMatch.groups['covered'])
      const ratio = covered / total
      result = {ratio, covered, threshold, total, pass: ratio >= threshold}
    }
  }
  return result ?? setFailed()
}
