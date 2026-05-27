import {parseFilesCoverage, parseSources, parseAverageCoverage} from './coverage'
import fs from 'fs'

const coverageFilePathV1 = './coverage.xml'
const coverageFilePathV2 = './coverage-v2.xml'
const coverageFilePathMultiSource = './coverage-multi-source.xml'

describe('coverage parsing', () => {
  it.each([coverageFilePathV1, coverageFilePathV2])('parses average coverage', coverageFilePath => {
    const report = fs.readFileSync(coverageFilePath, 'utf8')
    const parsed = parseAverageCoverage(report, 0.8)
    expect(parsed).toBeDefined()
    const {ratio, covered, total, pass, threshold} = parsed
    expect(total).toBe(1000)
    expect(covered).toBe(940)
    expect(ratio).toBe(0.94)
    expect(threshold).toBe(0.8)
    expect(pass).toBeTruthy()
  })
  it('parses coverage as expected when float', () => {
    const report = fs.readFileSync(coverageFilePathV1, 'utf8')
    const parsed = parseFilesCoverage(report, ['src'], ['src/coverage.ts'], 0.8)
    expect(parsed).toBeDefined()
    expect(parsed![0]).toBeDefined()
    expect(parsed![0].pass).toBeTruthy()
    expect(parsed![0].cover).toBe(0.99)
  })

  it('parses coverage as expected when zero', () => {
    const report = fs.readFileSync(coverageFilePathV1, 'utf8')
    const parsed = parseFilesCoverage(report, ['src'], ['src/main.ts'], 0.01)
    expect(parsed).toBeDefined()
    expect(parsed![0]).toBeDefined()
    expect(parsed![0].pass).toBeFalsy()
    expect(parsed![0].cover).toBe(0)
  })

  it('parses single source', () => {
    const report = fs.readFileSync(coverageFilePathV1, 'utf8')
    const sources = parseSources(report)
    expect(sources).toEqual(['src'])
  })

  it('parses multiple sources', () => {
    const report = fs.readFileSync(coverageFilePathMultiSource, 'utf8')
    const sources = parseSources(report)
    expect(sources).toEqual(['package1', 'package2', 'package3'])
  })

  it('returns coverage for files across multiple sources', () => {
    const report = fs.readFileSync(coverageFilePathMultiSource, 'utf8')
    const parsed = parseFilesCoverage(
      report,
      ['package1', 'package2', 'package3'],
      ['package1/coverage.ts', 'package2/format.ts', 'package3/main.ts'],
      0.5
    )
    expect(parsed).toBeDefined()
    expect(parsed).toHaveLength(3)
    expect(parsed![0]).toMatchObject({file: 'package1/coverage.ts', cover: 0.99, pass: true})
    expect(parsed![1]).toMatchObject({file: 'package2/format.ts', cover: 0.88, pass: true})
    expect(parsed![2]).toMatchObject({file: 'package3/main.ts', cover: 0, pass: false})
  })
})
