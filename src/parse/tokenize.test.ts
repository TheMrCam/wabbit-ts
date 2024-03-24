import { tokenize } from './tokenize'

describe('tokenize unit tests', () => {
  test('dabeaz example', () => {
    const source = 'print 123 + xy;'

    expect(tokenize(source)).toEqual([
      ['PRINT', 'print', { line: 1, colStart: 0, colEnd: 5 }],
      ['INTEGER', '123', { line: 1, colStart: 6, colEnd: 9 }],
      ['PLUS', '+', { line: 1, colStart: 10, colEnd: 11 }],
      ['NAME', 'xy', { line: 1, colStart: 12, colEnd: 14 }],
      ['SEMI', ';', { line: 1, colStart: 14, colEnd: 15 }],
    ])
  })
  test('keywords', () => {
    const source = 'if else return while print var func'

    expect(tokenize(source)).toEqual([
      ['IF', 'if', { line: 1, colStart: 0, colEnd: 2 }],
      ['ELSE', 'else', { line: 1, colStart: 3, colEnd: 7 }],
      ['RETURN', 'return', { line: 1, colStart: 8, colEnd: 14 }],
      ['WHILE', 'while', { line: 1, colStart: 15, colEnd: 20 }],
      ['PRINT', 'print', { line: 1, colStart: 21, colEnd: 26 }],
      ['VAR', 'var', { line: 1, colStart: 27, colEnd: 30 }],
      ['FUNC', 'func', { line: 1, colStart: 31, colEnd: 35 }],
    ])
  })
  test('symbols', () => {
    const source = '+ * = < { } ( ) , ; =='

    expect(tokenize(source)).toEqual([
      ['PLUS', '+', { line: 1, colStart: 0, colEnd: 1 }],
      ['TIMES', '*', { line: 1, colStart: 2, colEnd: 3 }],
      ['ASSIGN', '=', { line: 1, colStart: 4, colEnd: 5 }],
      ['LT', '<', { line: 1, colStart: 6, colEnd: 7 }],
      ['LBRACE', '{', { line: 1, colStart: 8, colEnd: 9 }],
      ['RBRACE', '}', { line: 1, colStart: 10, colEnd: 11 }],
      ['LPAREN', '(', { line: 1, colStart: 12, colEnd: 13 }],
      ['RPAREN', ')', { line: 1, colStart: 14, colEnd: 15 }],
      ['COMMA', ',', { line: 1, colStart: 16, colEnd: 17 }],
      ['SEMI', ';', { line: 1, colStart: 18, colEnd: 19 }],
      ['EQ', '==', { line: 1, colStart: 20, colEnd: 22 }],
    ])
  })
  test('x < y', () => {
    expect(tokenize('x < y')).toEqual([
      ['NAME', 'x', { line: 1, colStart: 0, colEnd: 1 }],
      ['LT', '<', { line: 1, colStart: 2, colEnd: 3 }],
      ['NAME', 'y', { line: 1, colStart: 4, colEnd: 5 }],
    ])
  })

  test('comment', () => {
    const source = `var x = 10; // comment
print x; // should be ignored
`
    expect(tokenize(source)).toEqual([
      ['VAR', 'var', { line: 1, colStart: 0, colEnd: 3 }],
      ['NAME', 'x', { line: 1, colStart: 4, colEnd: 5 }],
      ['ASSIGN', '=', { line: 1, colStart: 6, colEnd: 7 }],
      ['INTEGER', '10', { line: 1, colStart: 8, colEnd: 10 }],
      ['SEMI', ';', { line: 1, colStart: 10, colEnd: 11 }],
      ['PRINT', 'print', { line: 2, colStart: 0, colEnd: 5 }],
      ['NAME', 'x', { line: 2, colStart: 6, colEnd: 7 }],
      ['SEMI', ';', { line: 2, colStart: 7, colEnd: 8 }],
    ])
  })
})
