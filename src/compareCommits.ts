import {context} from '@actions/github'
import {octokit} from './client'

export type CommitsComparison = {
  newFiles: string[]
  modifiedFiles: string[]
}

export async function compareCommits(pr: number): Promise<CommitsComparison> {
  const {owner, repo} = context.repo

  const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number: pr,
    per_page: 100
  })

  const newFiles: string[] = []
  const modifiedFiles: string[] = []

  for (const file of files) {
    if (file.status === 'added') newFiles.push(file.filename)
    if (file.status === 'modified' || file.status === 'renamed') modifiedFiles.push(file.filename)
  }
  return {newFiles, modifiedFiles}
}
