import {parseFilesCoverage, parseSources, parseAverageCoverage} from './coverage'
import fs from 'fs'

jest.mock('@actions/core', () => ({
  getInput: jest.fn().mockReturnValue(''),
  setFailed: jest.fn(),
}))

const coverageFilePathV1 = './coverage.xml'
const coverageFilePathV2 = './coverage-v2.xml'
const coverageFilePathMultiSource = './coverage-multi-source.xml'
const coverageFilePathIdentityOauth = './coverage-identity-oauth.xml'

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

  // Bug 1: without the `g` flag, report.match(regex) stops at the first line that satisfies
  // the pattern. If the desired filename also appears earlier (e.g. as a `name=` value or a
  // shorter path prefix), the wrong coverage value is returned silently.
  it('returns the correct coverage when an identical filename appears on an earlier line', () => {
    // "di.py" appears as both `filename="di.py"` (line-rate=0.9394) and
    // `filename="event_handlers/remove_user_token/di.py"` (line-rate=0) in the fixture.
    // Without global matching the regex stops at the first line, returning the wrong value.
    const report = fs.readFileSync(coverageFilePathIdentityOauth, 'utf8')
    const source = '/home/runner/work/my-project/src'
    const parsed = parseFilesCoverage(
      report,
      [source],
      [`${source}/event_handlers/remove_user_token/di.py`],
      0.5
    )
    expect(parsed).toBeDefined()
    expect(parsed).toHaveLength(1)
    expect(parsed![0].cover).toBe(0)
    expect(parsed![0].pass).toBe(false)
  })

  // Bug 2: the per-file regex requires filename= to appear before line-rate= on the same line.
  // XML attribute order is not guaranteed; a report emitting line-rate first silently drops the file.
  it('returns coverage when line-rate attribute appears before filename attribute', () => {
    const report = '<class line-rate="0.75" filename="foo.py" name="foo.py">'
    const parsed = parseFilesCoverage(report, [], ['foo.py'], 0.5)
    expect(parsed).toBeDefined()
    expect(parsed).toHaveLength(1)
    expect(parsed![0].cover).toBe(0.75)
  })

  // Bug 3: the ratioRegex trailing `.*"` is greedy and can backtrack past the closing quote
  // of line-rate into a later attribute, capturing the wrong value.
  it('parses line-rate correctly when later attributes have quoted numeric values', () => {
    const report = '<coverage line-rate="0.75" lines-valid="1000" lines-covered="750" branches-covered="12" branches-valid="16">'
    const parsed = parseAverageCoverage(report, 0.5)
    expect(parsed.ratio).toBe(0.75)
  })

  // Bug 4: match?.length === 1 is always true when .match() has no `g` flag — it provides
  // no protection against multiple <coverage> elements. With the g flag, length > 1 means
  // the document has more than one root, which should be treated as an error.
  it('returns failure when the report contains multiple coverage elements', () => {
    const report =
      '<coverage line-rate="0.94" lines-valid="1000" lines-covered="940">\n' +
      '<coverage line-rate="0.50" lines-valid="200" lines-covered="100">'
    const parsed = parseAverageCoverage(report, 0.8)
    expect(parsed.ratio).toBe(-1)
  })

  // Bug 5: ratio is read directly from the XML line-rate attribute rather than derived from
  // covered / total. A report where these are inconsistent causes a wrong pass/fail verdict.
  it('derives ratio from covered/total rather than trusting the xml line-rate attribute', () => {
    // line-rate says 0.99 but covered/total is 500/1000 = 0.50
    const report =
      '<coverage line-rate="0.99" lines-valid="1000" lines-covered="500" branches-covered="0" branches-valid="0">'
    const parsed = parseAverageCoverage(report, 0.8)
    expect(parsed.ratio).toBeCloseTo(0.5)
    expect(parsed.pass).toBe(false)
  })

  // Bug 6: [.]* in the coverage capture group allows multiple dots (e.g. "0..99").
  // parseFloat silently truncates at the second dot, returning 0 instead of 0.99.
  it('does not match a line-rate value containing multiple decimal points', () => {
    const report = '<class filename="foo.py" line-rate="0..99" name="foo.py">'
    // A malformed value should not produce a plausible-looking result;
    // the file should be dropped (cover = -1 → filtered out) rather than returning 0.
    const parsed = parseFilesCoverage(report, [], ['foo.py'], 0.5)
    expect(parsed).toHaveLength(0)
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
