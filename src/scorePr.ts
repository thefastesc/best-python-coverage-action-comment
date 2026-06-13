import * as core from '@actions/core'

import {FilesCoverage} from './coverage'
import {buildCommentBody} from './build-comment-body'
import {toPercent} from './format'
import {context} from '@actions/github'
import {octokit} from './client'

function title(): string {
  return `# ☂️ ${core.getInput('title') || 'Code Coverage'}`
}

export async function publishMessage(pr: number, message: string): Promise<void> {
  const TITLE = title()
  const body = TITLE.concat(message)
  core.summary.addRaw(body).write()

  const postComment = core.getInput('postComment') !== 'false'
  if (!postComment) {
    core.info('Skipping PR comment — postComment is false')
    return
  }

  const allComments = await octokit.paginate(octokit.rest.issues.listComments, {
    ...context.repo,
    issue_number: pr,
    per_page: 100
  })
  const exist = allComments.find(comment => comment.body?.startsWith(TITLE))

  if (exist) {
    await octokit.rest.issues.updateComment({
      ...context.repo,
      issue_number: pr,
      comment_id: exist.id,
      body
    })
  } else {
    await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: pr,
      body
    })
  }
}

export async function scorePr(filesCover: FilesCoverage): Promise<boolean> {
  core.startGroup('Results')

  const sha = context.payload.pull_request?.head.sha.slice(0, 7) ?? 'unknown'
  const {body, passOverall} = buildCommentBody(filesCover, sha)

  const coverAll = toPercent(filesCover.averageCover.ratio)
  if (passOverall) {
    core.info(`Average coverage ${coverAll} ✅`)
  } else {
    core.error(`Average coverage ${coverAll} ❌`)
  }
  core.info(`sources: ${filesCover.sources.join(', ')}`)

  const hasChangedFiles = (filesCover.newCover?.length ?? 0) + (filesCover.modifiedCover?.length ?? 0) > 0
  if (!hasChangedFiles) {
    core.info('No new or modified files, skipping PR comment')
    core.endGroup()
    return passOverall
  }

  await publishMessage(context.issue.number, body)
  core.endGroup()
  return passOverall
}
