import { readFileSync } from 'fs'
import { parseSource } from './file'
import { resolve } from 'path'

describe('checkBraces', { concurrent: true }, () => {
  test('badbrace.wb', () => {
    const source = readFileSync(
      resolve(__dirname, '../../wabbi/tests/badbrace.wb')
    ).toString()
    expect(() => parseSource(source)).toThrow(`L5:1 - Found unopened '}'`)
  })
  test('badparen.wb', () => {
    const source = readFileSync(
      resolve(__dirname, '../../wabbi/tests/badparen.wb')
    ).toString()
    expect(() => parseSource(source)).toThrow(`L3:6 - Found unclosed '('`)
  })
})
