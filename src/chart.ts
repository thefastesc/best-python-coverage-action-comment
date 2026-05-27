import {Coverage} from './coverage'

const emptyChar = '░'
const fullChar = '█'

const percs = (): Record<number, number> => ({
  0: 0,
  10: 0,
  20: 0,
  30: 0,
  40: 0,
  50: 0,
  60: 0,
  70: 0,
  80: 0,
  90: 0,
  100: 0
})

function reduce(cover: Coverage[]): Record<number, number> {
  return cover.reduce((buckets, file) => {
    const bucket = Math.round((file.cover || 0) * 10) * 10
    return Object.assign(buckets, {[bucket]: buckets[bucket] + 1})
  }, percs())
}

const size = 23

const bar = (count: number, max: number): string =>
  fullChar.repeat(max > 0 ? Math.ceil((count / max) * size) : 0).padEnd(size, emptyChar)

const p2s = (p: number): string => p.toLocaleString('en', {style: 'percent', minimumFractionDigits: 1}).padStart(5)

function tostr(buckets: Record<number, number>): string {
  const max = Math.max(...Object.values(buckets))
  const sum = Object.values(buckets).reduce((a, v) => a + v, 0)
  const header = `Cover ┌─${'─'.repeat(size)}─┐ Freq.`
  const rows = Object.keys(buckets)
    .filter(k => buckets[Number(k)] > 0)
    .map(k => `${k.padStart(4)}% │ ${bar(buckets[Number(k)], max)} │ ${p2s(sum > 0 ? buckets[Number(k)] / sum : 0)}`)
    .join('\n')
  const footer = `      └─${'─'.repeat(size)}─┘`
  return `${header}\n${rows}\n${footer}`
}

export function chart(cover: Coverage[]): string {
  return `\n\`\`\`\n${tostr(reduce(cover))}\n\`\`\`\n`
}
