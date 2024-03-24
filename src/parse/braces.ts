import { SourceMap, Token } from './tokenize'

export const Brace = {
  checkTokens: checkBraces,
}

export function checkBraces(tokens: Token[]): Token[] {
  const stack: ['LPAREN' | 'LBRACE', string, SourceMap][] = []
  for (const [type, v, map] of tokens) {
    if (type === 'LPAREN' || type === 'LBRACE') {
      stack.push([type, v, map])
    } else if (type === 'RPAREN') {
      const lastBrace = stack.pop()
      if (!lastBrace || lastBrace[0] !== 'LPAREN')
        throw new SyntaxError(
          `L${map.line}:${map.colStart} - Found unopened ')'`
        )
    } else if (type === 'RBRACE') {
      const lastBrace = stack.pop()
      if (!lastBrace || lastBrace[0] !== 'LBRACE')
        throw new SyntaxError(
          `L${map.line}:${map.colStart} - Found unopened '}'`
        )
    }
  }
  if (stack.length > 0) {
    const syntaxMessage =
      stack.length === 1
        ? `L${stack[0][2].line}:${stack[0][2].colStart} - Found unclosed '${stack[0][1]}'`
        : `Found unclosed braces:
${stack
  .reverse()
  .map(([, v, m]) => `    L${m.line}:${m.colStart} - Found unclosed '${v}'`)}`
    throw new SyntaxError(syntaxMessage)
  }
  return tokens
}
