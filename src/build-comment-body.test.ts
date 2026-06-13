import {buildCommentBody} from './build-comment-body'
import {AverageCoverage, FilesCoverage} from './coverage'

const passingAverage: AverageCoverage = {
  ratio: 0.9,
  covered: 900,
  total: 1000,
  threshold: 0.8,
  pass: true
}

const failingAverage: AverageCoverage = {
  ratio: 0.7,
  covered: 700,
  total: 1000,
  threshold: 0.8,
  pass: false
}

function makeCoverage(overrides: Partial<FilesCoverage> = {}): FilesCoverage {
  return {averageCover: passingAverage, sources: ['src'], ...overrides}
}

describe('buildCommentBody', () => {
  it('includes passing summary when average coverage meets threshold', () => {
    const {body, passOverall} = buildCommentBody(makeCoverage(), 'abc1234')
    expect(body).toContain('passing')
    expect(body).toContain('90%')
    expect(body).toContain('Threshold: 80%')
    expect(passOverall).toBe(true)
  })

  it('includes failing summary when average coverage is below threshold', () => {
    const {body, passOverall} = buildCommentBody(makeCoverage({averageCover: failingAverage}), 'abc1234')
    expect(body).toContain('failing')
    expect(body).toContain('70%')
    expect(passOverall).toBe(false)
  })

  it('includes the commit sha in the footer', () => {
    const {body} = buildCommentBody(makeCoverage(), 'abc1234')
    expect(body).toContain('abc1234')
  })

  it('renders the footer as small text with a link to the action', () => {
    const {body} = buildCommentBody(makeCoverage(), 'abc1234')
    expect(body).toContain('<sub>')
    expect(body).toContain('thefastesc/python-coverage-action-comment')
    expect(body).toContain('abc1234')
  })

  it('omits new files section when there are no new files', () => {
    const {body} = buildCommentBody(makeCoverage(), 'abc1234')
    expect(body).not.toContain('New Files')
  })

  it('omits modified files section when there are no modified files', () => {
    const {body} = buildCommentBody(makeCoverage(), 'abc1234')
    expect(body).not.toContain('Modified Files')
  })

  it('includes new files section when new files are present', () => {
    const coverage = makeCoverage({
      newCover: [{file: 'src/new.ts', cover: 0.95, pass: true}]
    })
    const {body} = buildCommentBody(coverage, 'abc1234')
    expect(body).toContain('New Files')
    expect(body).toContain('src/new.ts')
  })

  it('includes modified files section when modified files are present', () => {
    const coverage = makeCoverage({
      modifiedCover: [{file: 'src/existing.ts', cover: 0.75, pass: true}]
    })
    const {body} = buildCommentBody(coverage, 'abc1234')
    expect(body).toContain('Modified Files')
    expect(body).toContain('src/existing.ts')
  })

  it('sets passOverall to false when a new file fails its threshold', () => {
    const coverage = makeCoverage({
      newCover: [{file: 'src/new.ts', cover: 0.5, pass: false}]
    })
    const {passOverall} = buildCommentBody(coverage, 'abc1234')
    expect(passOverall).toBe(false)
  })

  it('sets passOverall to false when a modified file fails its threshold', () => {
    const coverage = makeCoverage({
      modifiedCover: [{file: 'src/existing.ts', cover: 0.5, pass: false}]
    })
    const {passOverall} = buildCommentBody(coverage, 'abc1234')
    expect(passOverall).toBe(false)
  })

  it('includes the histogram when there are changed files', () => {
    const coverage = makeCoverage({
      modifiedCover: [{file: 'src/existing.ts', cover: 0.9, pass: true}]
    })
    const {body} = buildCommentBody(coverage, 'abc1234')
    expect(body).toContain('```')
    expect(body).toContain('Cover')
  })

  it('omits the histogram when there are no changed files', () => {
    const {body} = buildCommentBody(makeCoverage(), 'abc1234')
    expect(body).not.toContain('Cover ┌')
  })
})
