import {
  Assign,
  BinOpCodes,
  BinaryOperator,
  Call,
  Condition,
  ConditionCodes,
  ExprStatement,
  Expression,
  Func,
  IfElse,
  Integer,
  Name,
  Negate,
  Print,
  Program,
  Return,
  Statement,
  VarDecl,
  VarInit,
  While,
} from '../ast'
import { SourceMap, Token, TokenType } from './tokenize'

export const Parse = {
  program: parseProgram,
  statements: parseTokens,
  statement: parseStatement,
  expression: parseExpression,
}

export function parseProgram(tokens: Token[]): Program {
  return new Program(parseTokens(tokens))
}

// Left-to-right scan of token sequence
export function parseTokens(tokens: Token[]): Statement[] {
  let startStatementIndex = 0
  let searchingToken: StatementBeginning | null = null
  // let ifBraceCount = 0
  let braceCount = 0
  const tokenStatements: Token[][] = []
  for (let n = 0; n < tokens.length; n++) {
    const currentToken = tokens[n]
    if (isStatementBeginning(currentToken) && !searchingToken) {
      startStatementIndex = n
      searchingToken = currentToken[0]
      // ifBraceCount = 0
      braceCount = 0
    } else if (currentToken[0] === 'LBRACE') {
      braceCount += 1
    } else if (currentToken[0] === 'RBRACE' && braceCount > 0) {
      braceCount -= 1
    }
    if (
      searchingToken &&
      currentToken[0] === statementEndings[searchingToken] &&
      braceCount === 0
    ) {
      const nextToken = tokens.at(n + 1)
      if (searchingToken === 'IF' && nextToken && nextToken[0] === 'ELSE') {
        n += 1
        continue
      }
      searchingToken = null
      tokenStatements.push(tokens.slice(startStatementIndex, n + 1))
    }
  }

  return tokenStatements.map(parseStatement)
}

const statementEndings = {
  RETURN: 'SEMI',
  PRINT: 'SEMI',
  VAR: 'SEMI',
  NAME: 'SEMI',
  INTEGER: 'SEMI',
  IF: 'RBRACE',
  WHILE: 'RBRACE',
  FUNC: 'RBRACE',
} as const
type StatementBeginning = keyof typeof statementEndings
function isStatementBeginning(
  token: Token
): token is [StatementBeginning, string, SourceMap] {
  return Object.keys(statementEndings).includes(token[0])
}

export function parseStatement(tokens: Token[]): Statement {
  switch (tokens[0][0]) {
    case 'RETURN': {
      return parseReturnStatement(tokens)
    }
    case 'PRINT': {
      return parsePrintStatement(tokens)
    }
    // @ts-expect-error
    case 'NAME': {
      if (tokens[1][0] === 'ASSIGN') {
        return parseAssignStatement(tokens)
      }
      // if (tokens[1][0] === 'LPAREN') {
      //   // TODO: Call could be a statement, so NAME could start another statement
      // }
      // Fallthrough to INTEGER
    }
    case 'INTEGER': {
      return new ExprStatement(parseIntOrName(tokens))
    }

    case 'VAR': {
      return parseVarStatement(tokens)
    }
    case 'IF': {
      return parseIfElseStatement(tokens)
    }
    case 'WHILE': {
      return parseWhileStatement(tokens)
    }
    case 'FUNC': {
      return parseFuncStatement(tokens)
    }
    case 'ASSIGN':
    case 'ELSE':
    case 'INTEGER':
    case 'PLUS':
    case 'TIMES':
    case 'COMMA':
    case 'SEMI':
    case 'LPAREN':
    case 'RPAREN':
    case 'LBRACE':
    case 'RBRACE':
    case 'LT':
    case 'EQ': {
      throw new Error(`Invalid start to statement: '${tokens[0]}'`)
    }
    default: {
      throw new Error(`Misuderstood token ${tokens[0]}`)
    }
  }
}

// return AST nodes
function parsePrintStatement(tokens: Token[]): Print {
  // print expression ;
  if (tokens[0][0] !== 'PRINT') {
    throw new Error(`Expected token 'PRINT', got '${tokens[0][0]}'`)
  }
  const endIndex = tokens.findIndex(([t]) => t === 'SEMI')
  if (endIndex === -1) {
    throw new SyntaxError(`Expected token 'SEMI' after 'PRINT', found none`)
  }
  const exp = parseExpression(tokens.slice(1, endIndex))
  return new Print(exp)
}

function parseIfElseStatement(tokens: Token[]): IfElse {
  // if condition { statements } else { statements }
  expectToken(tokens[0], 'IF')
  const firstOpenIndex = tokens.findIndex(([t]) => t === 'LBRACE')
  if (firstOpenIndex === -1) {
    throw new SyntaxError(`Expected token 'LBRACE' after 'IF', found none`)
  }
  const compare = parseCondition(tokens.slice(1, firstOpenIndex))
  const elseIndex = tokens.findIndex(([t]) => t === 'ELSE')
  if (elseIndex === -1) {
    // optional else
    return new IfElse(compare, parseTokens(tokens.slice(firstOpenIndex + 1)))
  }
  expectToken(
    tokens[elseIndex - 1],
    'RBRACE',
    `Expected token 'RBRACE' after 'LBRACE', found ${tokens[elseIndex - 1]}`,
    SyntaxError
  )
  expectToken(
    tokens[elseIndex + 1],
    'LBRACE',
    `Expected token 'LBRACE' following 'ELSE', found ${tokens[elseIndex + 1]}`,
    SyntaxError
  )
  // const endIndex = tokens.findIndex(([t], i) => i > elseIndex && t === 'RBRACE')
  // TODO: fix if else statement parsing by keeping track of opened and closed braces
  // This _might_ be okay since parseTokens supposedly breaks statements up properly
  expectToken(tokens[tokens.length - 1], 'RBRACE')
  return new IfElse(
    compare,
    parseTokens(tokens.slice(firstOpenIndex + 1, elseIndex - 1)),
    parseTokens(tokens.slice(elseIndex + 2, tokens.length - 1))
  )
}

function parseWhileStatement(tokens: Token[]): While {
  // while condition { statements }
  if (tokens[0][0] !== 'WHILE') {
    throw new Error(`Expected token 'WHILE', got '${tokens[0][0]}'`)
  }
  const openIndex = tokens.findIndex(([t]) => t === 'LBRACE')
  if (openIndex === -1) {
    throw new SyntaxError(`Expected token 'LBRACE' after 'WHILE', found none`)
  }
  const compare = parseCondition(tokens.slice(1, openIndex))
  const endIndex = tokens.findIndex(([t]) => t === 'RBRACE')
  if (endIndex === -1) {
    throw new SyntaxError(`Expected token 'RBRACE' after 'LBRACE', found none`)
  }
  const statements = parseTokens(tokens.slice(openIndex, endIndex))
  return new While(compare, statements)
}

function parseVarStatement(tokens: Token[]): VarInit | VarDecl {
  // var name ;
  // var name = expression ;
  expectToken(tokens[0], 'VAR')
  if (tokens[1][0] !== 'NAME') {
    throw new SyntaxError(
      `Expected token 'NAME' following 'VAR', found ${tokens[1][0]}`
    )
  }
  const endIndex = tokens.findIndex(([t]) => t === 'SEMI')
  if (endIndex === -1) {
    throw new SyntaxError(`Expected token 'SEMI' after 'VAR', found none`)
  } else if (endIndex === 2) {
    return new VarDecl(parseName(tokens[1]))
  }
  return new VarInit(
    parseName(tokens[1]),
    parseExpression(tokens.slice(3, endIndex))
  )
}

function parseAssignStatement(tokens: Token[]): Assign {
  // name = expression ;
  expectToken(tokens[1], 'ASSIGN')
  expectToken(
    tokens[0],
    'NAME',
    `Invalid 'ASSIGN' statement: must assign to a 'NAME'`
  )
  const name = parseName(tokens[0])
  const exp = parseExpression(tokens.slice(2))
  return new Assign(name, exp)
}

function parseFuncStatement(tokens: Token[]): Func {
  // func name ( a , r , g ) { statements }
  expectToken(tokens[0], 'FUNC')
  expectToken(tokens[1], 'NAME')
  expectToken(tokens[2], 'LPAREN')
  const parameters = parseParameters(tokens.slice(3))
  const braceIndex = parameters.length ? parameters.length * 2 + 3 : 4 //tokenLengthToNextBrace(parameters.length)
  expectToken(tokens[braceIndex], 'LBRACE')
  // TODO: fix function statement parsing by keeping track of opened and closed braces
  // see parseIfElseStatement
  expectToken(
    tokens[tokens.length - 1],
    'RBRACE',
    `Expected token 'RBRACE' at end of function ${tokens[1]}`
  )
  const statements = parseTokens(
    tokens.slice(braceIndex, tokens.length - 1) /*, false*/
  )
  return new Func(parseName(tokens[1]), parameters, statements)
}

export function parseParameters(tokens: Token[]): Name[] {
  if (tokens[0][0] === 'RPAREN') return []
  expectToken(tokens[0], 'NAME')

  const argTokens: Token[] = []
  let n = 0
  for (; tokens[n][0] !== 'RPAREN' && n < tokens.length; n++) {
    if (tokens[n][0] === 'COMMA') {
      continue
    } else if (tokens[n][0] === 'NAME') {
      argTokens.push(tokens[n])
    }
  }
  expectToken(
    tokens[n],
    'RPAREN',
    `Expected token 'RPAREN' after argument list, found none`
  )

  return argTokens.map(parseName)
}

export function parseArguments(tokens: Token[]): Expression[] {
  // ...args: Name[] )

  if (tokens[0][0] === 'RPAREN') return []

  const argTokens: Token[][] = []
  let n = 0
  while (tokens[n][0] !== 'RPAREN' && n < tokens.length) {
    if (tokens[n][0] === 'INTEGER' || tokens[n][0] === 'NAME') {
      if (tokens[n + 1][0] === 'COMMA' || tokens[n + 1][0] === 'RPAREN') {
        // single term
        argTokens.push([tokens[n]])
        n += 1
        continue
      } else if (tokens[n + 1][0] === 'PLUS' || tokens[n + 1][0] === 'TIMES') {
        // single binop
        argTokens.push(tokens.slice(n, n + 3))
        n += 3
      }
      if (tokens[n][0] === 'NAME' && tokens[n + 1][0] === 'LPAREN') {
        // function call
        const endParen = tokens.findIndex(([t]) => t === 'RPAREN')
        if (endParen === -1 || endParen === tokens.length) {
          throw new SyntaxError(
            `Expected token 'RPAREN' after 'LPAREN', found none`
          )
        }
        argTokens.push(tokens.slice(n, endParen + 1))
        n = endParen
      }
    } else if (tokens[n][0] === 'LPAREN') {
      // grouped binop
      const endParen = tokens.findIndex(([t]) => t === 'RPAREN')
      if (endParen === -1 || endParen === tokens.length) {
        throw new SyntaxError(
          `Expected token 'RPAREN' after 'LPAREN', found none`
        )
      }
      argTokens.push(tokens.slice(n, endParen + 1))
      n = endParen
    } else {
      n += 1
    }
  }
  expectToken(
    tokens[n],
    'RPAREN',
    `Expected token 'RPAREN' after argument list, found none`
  )

  return argTokens.map(parseExpression)
}

function parseReturnStatement(tokens: Token[]): Return {
  expectToken(tokens[0], 'RETURN')
  const endIndex = tokens.findIndex(([t]) => t === 'SEMI')
  if (endIndex === -1) {
    throw new SyntaxError(`Expected token 'SEMI' after 'RETURN', found none`)
  }
  const exp = parseExpression(tokens.slice(1, endIndex))
  return new Return(exp)
}

const expressionBeginnings: TokenType[] = [
  'NAME', // NAME, CALL, BINOP, COMPARE
  'INTEGER', // INTEGER, BINOP, COMPARE
  'LPAREN', // GROUPING
] as const

export function parseExpression(tokens: Token[]): Expression {
  switch (tokens[0][0]) {
    case 'NAME':
    case 'INTEGER': {
      return parseIntOrName(tokens)
    }
    case 'LPAREN': {
      // starts off grouped binary operator
      const rParenIndex = tokens.findIndex(([t]) => t === 'RPAREN')
      if (rParenIndex === -1) {
        throw new SyntaxError(
          `Expected token 'RPAREN' after 'LPAREN', found none`
        )
      }

      const nextOpIndex = rParenIndex + 1
      if (
        tokens.length > nextOpIndex &&
        binOpCodes.includes(tokens[nextOpIndex][0])
      ) {
        // group has more afterwards. Someone needs to pick that up, might as well be here
        return BinaryOperator.fromOp(
          tokens[nextOpIndex][1] as BinOpCodes,
          parseBinaryExpression(tokens.slice(1, rParenIndex)),
          parseExpression(tokens.slice(nextOpIndex + 1))
        )
      }
      return parseBinaryExpression(tokens.slice(1, rParenIndex))
    }
    case 'MINUS': {
      // let end = 1
      // if (tokens[1][0] === 'LPAREN') {
      //   end = tokens.findIndex(([t]) => t === 'RPAREN')
      //   if (end === -1) {
      //     throw new Error(`Expected token 'RPAREN' after 'LPAREN', found none`)
      //   }
      // }

      // const maybeOp = tokens.at(end + 1)
      // if (maybeOp && [...binOpCodes, ...conditionCodes].includes(maybeOp[0])) {
      //   return BinaryOperator.fromOp(
      //     maybeOp[1] as BinOpCodes,
      //     new Negate(parseExpression(tokens.slice(1, end + 1))),
      //     parseExpression(tokens.slice(end + 2))
      //   )
      // }
      // return new Negate(parseExpression(tokens.slice(1, end + 1)))
      let end = 1
      if (tokens[1][0] === 'LPAREN') {
        end = tokens.findIndex(([t]) => t === 'RPAREN')
        if (end === -1) {
          throw new Error(`Expected token 'RPAREN' after 'LPAREN', found none`)
        }
      }

      const expr = parseExpression(tokens.slice(1, end + 1))
      const negate = new Negate(expr, expr.type)

      const maybeOp = tokens.at(end + 1)

      if (maybeOp && [...binOpCodes, ...conditionCodes].includes(maybeOp[0])) {
        return BinaryOperator.fromOp(
          maybeOp[1] as BinOpCodes,
          negate,
          parseExpression(tokens.slice(end + 2))
        )
      }
      return negate
    }

    case 'DIVIDE':
    case 'PLUS':
    case 'TIMES':
    case 'ASSIGN':
    case 'COMMA':
    case 'SEMI':
    case 'RPAREN':
    case 'LBRACE':
    case 'RBRACE':
    case 'LT':
    case 'EQ':
    case 'LE':
    case 'GT':
    case 'GE':
    case 'NE':

    case 'IF':
    case 'ELSE':
    case 'FUNC':
    case 'RETURN':
    case 'VAR':
    case 'PRINT':
    case 'WHILE': {
      throw new Error(`Invalid token to start expression: '${tokens[0][0]}'`)
    }

    default: {
      throw new Error(`Misunderstood token ${tokens[0]}`)
    }
  }
}

function parseIntOrName(
  tokens: Token[],
  parse: (t: Token) => Integer | Name = parseSingleToken
) {
  if (tokens.length === 1) return parse(tokens[0])
  if (tokens[0][0] === 'NAME' && tokens[1][0] === 'LPAREN') {
    return parseCall(tokens)
  }
  if (![...binOpCodes, ...conditionCodes].includes(tokens[1][0])) {
    return parse(tokens[0])
  }
  switch (tokens[1][0]) {
    case 'PLUS':
    case 'TIMES':
    case 'MINUS':
    case 'DIVIDE': {
      return parseBinaryExpression(tokens)
    }
    case 'LT':
    case 'EQ':
    case 'LE':
    case 'GT':
    case 'GE':
    case 'NE': {
      return parseCondition(tokens)
    }
    case 'IF':
    case 'ELSE':
    case 'FUNC':
    case 'RETURN':
    case 'VAR':
    case 'PRINT':
    case 'WHILE':
    case 'INTEGER':
    case 'NAME':
    case 'ASSIGN':
    case 'COMMA':
    case 'SEMI':
    case 'RPAREN':
    case 'LBRACE':
    case 'RBRACE':
    default: {
      console.log(`How'd you even get here?`)
      return parse(tokens[0])
    }
  }
}
function parseSingleToken([type, value]: Token): Integer | Name {
  switch (type) {
    case 'NAME':
      return new Name(value, 'INTEGER')
    case 'INTEGER':
      return new Integer(+value)
    default:
      throw new Error(`Invalid token type: '${type}'`)
  }
}

export function parseInteger(token: Token): Integer {
  expectToken(token, 'INTEGER')
  return new Integer(+token[1])
}

export function parseName(token: Token): Name {
  expectToken(token, 'NAME')
  return new Name(token[1], 'INTEGER')
}

export function parseCall(tokens: Token[]): Call {
  expectToken(tokens[0], 'NAME')
  expectToken(tokens[1], 'LPAREN')
  const args = parseArguments(tokens.slice(2))
  return new Call(parseName(tokens[0]), args)
}

const conditionCodes = ['LT', 'EQ', 'LE', 'GT', 'GE', 'NE']
export function parseCondition(tokens: Token[]): Condition {
  const middleIndex = tokens.findIndex(([t]) => conditionCodes.includes(t))
  if (middleIndex === -1) {
    throw new Error(
      `Invalid condition expression, no 'LT', 'LE', 'GT', 'GE', 'EQ', or 'NE' token found`
    )
  }
  return Condition.fromOp(
    tokens[middleIndex][1] as ConditionCodes,
    parseExpression(tokens.slice(0, middleIndex)),
    parseExpression(tokens.slice(middleIndex + 1))
  )
}

const binOpCodes = ['PLUS', 'TIMES', 'MINUS', 'DIVIDE']
export function parseBinaryExpression(tokens: Token[]) {
  // term + term
  // term * term
  // term - term
  // term / term
  // groups are handled elsewhere
  const middleIndex = tokens.findIndex(([t]) => binOpCodes.includes(t))
  if (middleIndex === -1) {
    throw new Error(
      `Invalid binary expression, no 'PLUS', 'TIMES', 'MINUS', or 'DIVIDE' token found`
    )
  }
  return BinaryOperator.fromOp(
    tokens[middleIndex][1] as BinOpCodes,
    parseExpression(tokens.slice(0, middleIndex)),
    parseExpression(tokens.slice(middleIndex + 1))
  )
}

function expectToken(
  token: Token,
  expected?: TokenType,
  errorString = `Expected token '${expected}', got ${token[0]}`,
  error = Error
) {
  if (token[0] !== expected) {
    throw new error(errorString)
  }
  return
}
