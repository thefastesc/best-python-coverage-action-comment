import * as core from '@actions/core'
import {publishMessage} from './scorePr'

jest.mock('@actions/github', () => ({
  context: {
    repo: {owner: 'thefastesc', repo: 'python-coverage-action-comment'},
    issue: {number: 42}
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
  getInput: jest.fn(),
  summary: {addRaw: (...args: unknown[]) => mockAddRaw(...args)},
  info: jest.fn(),
  error: jest.fn(),
  setFailed: jest.fn(),
  startGroup: jest.fn(),
  endGroup: jest.fn()
}))

const mockGetInput = core.getInput as jest.Mock

function setupInputs(postComment: string, title = 'Code Coverage'): void {
  mockGetInput.mockImplementation((key: string) => {
    if (key === 'postComment') return postComment
    if (key === 'title') return title
    return ''
  })
}

describe('publishMessage', () => {
  beforeEach(() => {
    mockPaginate.mockResolvedValue([])
    mockCreateComment.mockResolvedValue({})
    mockUpdateComment.mockResolvedValue({})
  })

  it('always writes the job summary regardless of postComment', async () => {
    setupInputs('false')
    await publishMessage(42, 'body text')
    expect(mockAddRaw).toHaveBeenCalled()
  })

  it('skips PR comment and logs when postComment is false', async () => {
    setupInputs('false')
    await publishMessage(42, 'body text')
    expect(mockPaginate).not.toHaveBeenCalled()
    expect(mockCreateComment).not.toHaveBeenCalled()
    expect(mockUpdateComment).not.toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledWith(expect.stringContaining('Skipping PR comment'))
  })

  it('creates a new comment when none exists', async () => {
    setupInputs('true')
    mockPaginate.mockResolvedValue([])
    await publishMessage(42, 'body text')
    expect(mockCreateComment).toHaveBeenCalledWith(
      expect.objectContaining({issue_number: 42, body: expect.any(String)})
    )
    expect(mockUpdateComment).not.toHaveBeenCalled()
  })

  it('updates an existing comment when one with the same title already exists', async () => {
    setupInputs('true', 'Code Coverage')
    mockPaginate.mockResolvedValue([{id: 99, body: '# ☂️ Code Coverage\nprevious content'}])
    await publishMessage(42, 'new content')
    expect(mockUpdateComment).toHaveBeenCalledWith(
      expect.objectContaining({comment_id: 99, body: expect.stringContaining('new content')})
    )
    expect(mockCreateComment).not.toHaveBeenCalled()
  })

  it('creates a new comment when an existing comment has a different title', async () => {
    setupInputs('true', 'Code Coverage')
    mockPaginate.mockResolvedValue([{id: 99, body: '# ☂️ Different Title\nsome content'}])
    await publishMessage(42, 'body text')
    expect(mockCreateComment).toHaveBeenCalled()
    expect(mockUpdateComment).not.toHaveBeenCalled()
  })
})
