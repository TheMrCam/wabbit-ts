import { ExprTypes } from '../ast'

export type Token = [type: TokenType, value: string, sourceMap: SourceMap]
export type TokenType =
  | ExprTypes
  | 'IF'
  | 'ELSE'
  | 'FUNC'
  | 'RETURN'
  | 'VAR'
  | 'PRINT'
  | 'WHILE'
  | 'INTEGER'
  | 'PLUS'
  | 'TIMES'
  | 'MINUS'
  | 'DIVIDE'
  | 'NAME'
  | 'ASSIGN'
  | 'COMMA'
  | 'SEMI'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACE'
  | 'RBRACE'
  | 'LT'
  | 'EQ'
  | 'LE'
  | 'GT'
  | 'GE'
  | 'NE'

export type SourceMap = {
  line: number
  colStart: number
  colEnd: number
}

const SymbolTokenTable: { [t: string]: TokenType | undefined } = {
  '=': 'ASSIGN',
  '+': 'PLUS',
  '*': 'TIMES',
  '-': 'MINUS',
  '/': 'DIVIDE',
  ',': 'COMMA',
  ';': 'SEMI',
  '(': 'LPAREN',
  ')': 'RPAREN',
  '{': 'LBRACE',
  '}': 'RBRACE',
  '<': 'LT',
  '==': 'EQ',
  '<=': 'LE',
  '>': 'GT',
  '>=': 'GE',
  '!=': 'NE',
}
const KeywordTokenTable: { [t: string]: TokenType | undefined } = {
  if: 'IF',
  else: 'ELSE',
  return: 'RETURN',
  while: 'WHILE',
  func: 'FUNC',
  var: 'VAR',
  print: 'PRINT',
}

const TypeIdentifierTable: { [t: string]: TokenType | undefined } = {
  int: 'INTEGER',
  float: 'FLOAT',
}

function checkSingleCharacter(
  c: string,
  sourceMap: SourceMap
): Token | undefined {
  const t = SymbolTokenTable[c]
  if (!t) return
  return [t, c, sourceMap]
}

const wordRegEx = /(^[a-zA-Z_\$]\w*)/
const digitRegEx = /^(\d+\.?\d*)/

export function tokenize(source: string): Token[] {
  let n = 0
  let line = 1
  let colStart = 0
  const tokens: Token[] = []
  while (n < source.length) {
    if (source.substring(n, n + 2) === '//') {
      const commentUntil = source.indexOf('\n', n + 2)
      if (commentUntil === -1)
        throw new SyntaxError(`L${line}:${colStart} - Invalid comment`)
      line += 1
      colStart = 0
      if (commentUntil > n) n = commentUntil + 1
      continue
    }
    if (source[n] === '\n') {
      line += 1
      n += 1
      colStart = 0
      continue
    }
    // For some reason I don't quite understand, ';\n' counts as ';' for indexing the SymbolTokenTable
    // Rather than figure out why and adjust for it, I'll just use twoChar.length to correct when it happens
    const twoChar = source.substring(n, n + 2)
    const maybeCond = SymbolTokenTable[twoChar]
    if (maybeCond) {
      tokens.push([
        maybeCond,
        twoChar,
        { line, colStart, colEnd: colStart + twoChar.length },
      ])
      n += twoChar.length
      colStart += twoChar.length
    }
    const maybeSingleToken = checkSingleCharacter(source[n], {
      line,
      colStart,
      colEnd: colStart + 1,
    })
    if (maybeSingleToken) {
      tokens.push(maybeSingleToken)
      n += 1
      colStart += 1
    } else if (wordRegEx.test(source.substring(n))) {
      const m = wordRegEx.exec(source.substring(n))
      if (!m) {
        n += 1
        colStart += 1
        continue
      }
      const word = m[0]
      const maybeType = TypeIdentifierTable[word]
      const maybeKeyword = KeywordTokenTable[word]
      if (maybeType) {
        tokens.push([
          maybeType,
          word,
          { line, colStart, colEnd: colStart + word.length },
        ])
      } else if (maybeKeyword) {
        tokens.push([
          maybeKeyword,
          word,
          { line, colStart, colEnd: colStart + word.length },
        ])
      } else {
        tokens.push([
          'NAME',
          word,
          { line, colStart, colEnd: colStart + word.length },
        ])
      }
      n += word.length
      colStart += word.length
    } else if (digitRegEx.test(source.substring(n))) {
      const d = digitRegEx.exec(source.substring(n))
      if (!d) {
        n += 1
        colStart += 1
        continue
      }
      const num = d[0]
      tokens.push([
        num.includes('.') ? 'FLOAT' : 'INTEGER',
        num,
        { line, colStart, colEnd: colStart + num.length },
      ])
      n += num.length
      colStart += num.length
    } else {
      if (![' ', undefined].includes(source[n]))
        console.log(`L${line}:${colStart} - Bad token`, source[n])
      n += 1
      colStart += 1
    }
  }

  return tokens
}
