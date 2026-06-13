import {Coverage} from './coverage'
import {markdownTable} from 'markdown-table'
import * as core from '@actions/core'

const passIcon = core.getInput('passIcon') || '🟢'
const failIcon = core.getInput('failIcon') || '🔴'
const passOrFailIndicator = (predicate: boolean): string => (predicate ? passIcon : failIcon)

export function toPercent(value: number): string {
  return `${(100 * value).toFixed()}%`
}

export function formatFilesTable(
  cover: Coverage[],
  totalRatio: number,
  fileLabel = 'File'
): {coverTable: string; pass: boolean} {
  const pass = cover.every(x => x.pass)
  const averageIndicator = passOrFailIndicator(pass)
  const coverTable = markdownTable(
    [
      [fileLabel, 'Cover'],
      ...cover.map(coverFile => {
        const coverPrecent = `${(coverFile.cover * 100).toFixed()}%`
        const indicator = passOrFailIndicator(coverFile.pass)
        const formatedFile = coverFile.file.replace(/_/g, '\\_')
        return [`${indicator} ${formatedFile}`, coverPrecent]
      }),
      [`${averageIndicator} **TOTAL**`, `**${toPercent(totalRatio)}**`]
    ],
    {align: ['l', 'c']}
  )
  return {coverTable, pass}
}
// touch
