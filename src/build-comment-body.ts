import {Coverage, FilesCoverage} from './coverage'
import {chart} from './chart'
import {formatFilesTable, toPercent} from './format'

export function buildCommentBody(filesCover: FilesCoverage, sha: string): {body: string; passOverall: boolean} {
  let message = ''
  let passOverall = filesCover.averageCover.pass

  const {ratio, covered, total, threshold, pass} = filesCover.averageCover
  const statusEmoji = pass ? '✅' : '❌'
  const statusWord = pass ? 'passing' : 'failing'
  const summary = `${statusEmoji} Coverage: **${statusWord}** with **${toPercent(ratio)}** — ${covered}/${total} statements covered. Threshold: ${toPercent(threshold)}`

  if (filesCover.newCover?.length) {
    const {coverTable, pass: passNew} = formatFilesTable(filesCover.newCover, filesCover.averageCover.ratio, 'New File')
    passOverall = passOverall && passNew
    message = message.concat(`\n<details><summary>New Files</summary>\n\n${coverTable}\n</details>`)
  }

  if (filesCover.modifiedCover?.length) {
    const {coverTable, pass: passModified} = formatFilesTable(
      filesCover.modifiedCover,
      filesCover.averageCover.ratio,
      'Modified File'
    )
    passOverall = passOverall && passModified
    message = message.concat(`\n<details><summary>Modified Files</summary>\n\n${coverTable}\n</details>`)
  }

  const allFiles: Coverage[] = [...(filesCover.newCover ?? []), ...(filesCover.modifiedCover ?? [])]
  const histogram = allFiles.length > 0 ? chart(allFiles) : ''

  const action = '[action](https://github.com/marketplace/actions/best-python-coverage-action-comment)'
  message = message.concat(`\n\n\n> **updated for commit: \`${sha}\` by ${action}🐍**`)

  return {body: `\n${summary}${histogram}${message}`, passOverall}
}
