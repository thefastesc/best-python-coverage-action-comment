import {toPercent, formatFilesTable} from './format'

jest.mock('@actions/core', () => ({
  getInput: jest.fn().mockReturnValue('')
}))

describe('toPercent', () => {
  it('converts a ratio to a rounded percentage string', () => {
    expect(toPercent(0.94)).toBe('94%')
    expect(toPercent(0.0)).toBe('0%')
    expect(toPercent(1.0)).toBe('100%')
    expect(toPercent(0.855)).toBe('86%')
  })
})

describe('formatFilesTable', () => {
  it('passes when all files meet the threshold', () => {
    const cover = [
      {file: 'src/a.ts', cover: 0.9, pass: true},
      {file: 'src/b.ts', cover: 0.95, pass: true}
    ]
    const {pass} = formatFilesTable(cover, 0.9)
    expect(pass).toBe(true)
  })

  it('fails when any file does not meet the threshold', () => {
    const cover = [
      {file: 'src/a.ts', cover: 0.9, pass: true},
      {file: 'src/b.ts', cover: 0.5, pass: false}
    ]
    const {pass} = formatFilesTable(cover, 0.9)
    expect(pass).toBe(false)
  })

  it('includes each filename in the table', () => {
    const cover = [
      {file: 'src/a.ts', cover: 0.9, pass: true},
      {file: 'src/b.ts', cover: 0.5, pass: false}
    ]
    const {coverTable} = formatFilesTable(cover, 0.9)
    expect(coverTable).toContain('src/a.ts')
    expect(coverTable).toContain('src/b.ts')
  })

  it('includes the total row', () => {
    const cover = [{file: 'src/a.ts', cover: 0.9, pass: true}]
    const {coverTable} = formatFilesTable(cover, 0.9)
    expect(coverTable).toContain('TOTAL')
  })

  it('uses a custom file label when provided', () => {
    const cover = [{file: 'src/new.ts', cover: 0.9, pass: true}]
    const {coverTable} = formatFilesTable(cover, 0.9, 'New File')
    expect(coverTable).toContain('New File')
  })
})
