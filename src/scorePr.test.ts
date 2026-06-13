import * as core from '@actions/core'
import {scorePr} from './scorePr'
import {AverageCoverage, FilesCoverage} from './coverage'

jest.mock('@actions/github', () => ({
  context: {
    repo: {owner: 'thefastesc', repo: 'python-coverage-action-comment'},
    issue: {number: 42},
    payload: {pull_request: {head: {sha: 'abc1234567'}}}
  },
  getOctokit: jest.fn()
}))

const mockPaginate = jest.fn()
const mockCreateComment = jest.fn()
const mockUpdateComment = jest.fn()
const mockAddRaw = jest.fn().mockReturnValue({write: jest.fn()})

jest.mock('./client', () => ({
  octokit: {
    paginate: (...args: unknown[]) => mockPaginate(...args),
    rest: {
      issues: {
        listComments: jest.fn(),
        createComment: (...args: unknown[]) => mockCreateComment(...args),
        updateComment: (...args: unknown[]) => mockUpdateComment(...args)
      }
    }
  }
}))

jest.mock('@actions/core', () => ({
  getInput: jest.fn().mockReturnValue(''),
  summary: {addRaw: (...args: unknown[]) => mockAddRaw(...args)},
  info: jest.fn(),
  error: jest.fn(),
  setFailed: jest.fn(),
  startGroup: jest.fn(),
  endGroup: jest.fn()
}))

const passingAverage: AverageCoverage = {
  ratio: 0.9,
  covered: 900,
  total: 1000,
  threshold: 0.8,
  pass: true
}

function makeCoverage(overrides: Partial<FilesCoverage> = {}): FilesCoverage {
  return {averageCover: passingAverage, sources: ['src'], ...overrides}
}

describe('scorePr', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPaginate.mockResolvedValue([])
    mockCreateComment.mockResolvedValue({})
    mockUpdateComment.mockResolvedValue({})
  })

  it('skips the PR comment and logs when there are no new or modified files', async () => {
    await scorePr(makeCoverage())
    expect(mockPaginate).not.toHaveBeenCalled()
    expect(mockCreateComment).not.toHaveBeenCalled()
    expect(mockUpdateComment).not.toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledWith(expect.stringContaining('No new or modified files'))
  })

  it('returns the correct pass result when there are no changed files', async () => {
    const result = await scorePr(makeCoverage())
    expect(result).toBe(true)
  })

  it('posts a PR comment when there are new files', async () => {
    const coverage = makeCoverage({
      newCover: [{file: 'src/new.ts', cover: 0.95, pass: true}]
    })
    await scorePr(coverage)
    expect(mockPaginate).toHaveBeenCalled()
    expect(mockCreateComment).toHaveBeenCalled()
  })

  it('posts a PR comment when there are modified files', async () => {
    const coverage = makeCoverage({
      modifiedCover: [{file: 'src/existing.ts', cover: 0.85, pass: true}]
    })
    await scorePr(coverage)
    expect(mockPaginate).toHaveBeenCalled()
    expect(mockCreateComment).toHaveBeenCalled()
  })
})
