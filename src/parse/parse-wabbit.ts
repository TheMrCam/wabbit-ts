import {
  Assign,
  BinOpCodes,
  BinaryOperator,
  Call,
  Condition,
  ConditionCodes,
  ExprStatement,
  ExprTypes,
  Expression,
  Float,
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
  const typeCache = new Map<string, ExprTypes>()
  return new Program(parseTokens(tokens, typeCache))
}

// Left-to-right scan of token sequence
export function parseTokens(
  tokens: Token[],
  typeCache: TypeCache
): Statement[] {
  let startStatementIndex = 0
  let searchingToken: StatementBeginning | null = null
  let braceCount = 0
  const tokenStatements: Token[][] = []
  for (let n = 0; n < tokens.length; n++) {
    const currentToken = tokens[n]
    if (isStatementBeginning(currentToken) && !searchingToken) {
      startStatementIndex = n
      searchingToken = currentToken[0]
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

  // return statements
  return tokenStatements.map((s) => parseStatement(s, typeCache as TypeCache))
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

export function parseStatement(
  tokens: Token[],
  typeCache: TypeCache
): Statement {
  switch (tokens[0][0]) {
    case 'RETURN': {
      return parseReturnStatement(tokens, typeCache)
    }
    case 'PRINT': {
      return parsePrintStatement(tokens, typeCache)
    }
    // @ts-expect-error
    case 'NAME': {
      if (tokens[1][0] === 'ASSIGN') {
        return parseAssignStatement(tokens, typeCache)
      }
      if (tokens[1][0] === 'LPAREN') {
        return parseCall(tokens, typeCache)
        // TODO: Call could be a statement, so NAME could start another statement
        // TODO: fix this
      }
      // Fallthrough to INTEGER
    }
    case 'FLOAT':
    case 'INTEGER': {
      return new ExprStatement(parseNumber(tokens, typeCache))
    }

    case 'VAR': {
      return parseVarStatement(tokens, typeCache)
    }
    case 'IF': {
      return parseIfElseStatement(tokens, typeCache)
    }
    case 'WHILE': {
      return parseWhileStatement(tokens, typeCache)
    }
    case 'FUNC': {
      return parseFuncStatement(tokens, typeCache)
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
function parsePrintStatement(tokens: Token[], typeCache: TypeCache): Print {
  // print expression ;
  if (tokens[0][0] !== 'PRINT') {
    throw new Error(`Expected token 'PRINT', got '${tokens[0][0]}'`)
  }
  const endIndex = tokens.findIndex(([t]) => t === 'SEMI')
  if (endIndex === -1) {
    throw new SyntaxError(`Expected token 'SEMI' after 'PRINT', found none`)
  }
  const exp = parseExpression(tokens.slice(1, endIndex), typeCache)
  return new Print(exp)
}

function parseIfElseStatement(tokens: Token[], typeCache: TypeCache): IfElse {
  // if condition { statements } else { statements }
  expectToken(tokens[0], 'IF')
  const firstOpenIndex = tokens.findIndex(([t]) => t === 'LBRACE')
  if (firstOpenIndex === -1) {
    throw new SyntaxError(`Expected token 'LBRACE' after 'IF', found none`)
  }
  const compare = parseCondition(tokens.slice(1, firstOpenIndex), typeCache)
  const elseIndex = tokens.findIndex(([t]) => t === 'ELSE')
  if (elseIndex === -1) {
    // optional else
    return new IfElse(
      compare,
      parseTokens(tokens.slice(firstOpenIndex + 1), typeCache)
    )
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
    parseTokens(tokens.slice(firstOpenIndex + 1, elseIndex - 1), typeCache),
    parseTokens(tokens.slice(elseIndex + 2, tokens.length - 1), typeCache)
  )
}

function parseWhileStatement(tokens: Token[], typeCache: TypeCache): While {
  // while condition { statements }
  if (tokens[0][0] !== 'WHILE') {
    throw new Error(`Expected token 'WHILE', got '${tokens[0][0]}'`)
  }
  const openIndex = tokens.findIndex(([t]) => t === 'LBRACE')
  if (openIndex === -1) {
    throw new SyntaxError(`Expected token 'LBRACE' after 'WHILE', found none`)
  }
  const compare = parseCondition(tokens.slice(1, openIndex), typeCache)
  const endIndex = tokens.findIndex(([t]) => t === 'RBRACE')
  if (endIndex === -1) {
    throw new SyntaxError(`Expected token 'RBRACE' after 'LBRACE', found none`)
  }
  const statements = parseTokens(tokens.slice(openIndex, endIndex), typeCache)
  return new While(compare, statements)
}

function parseVarStatement(
  tokens: Token[],
  typeCache: TypeCache
): VarInit | VarDecl {
  // var name type ;
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
  } else if (endIndex === 3) {
    if (!(typeTokens as TokenType[]).includes(tokens[2][0])) {
      const { line, colStart, colEnd } = tokens[0][2]
      throw new SyntaxError(
        `L${line}:${colStart}-${colEnd} - Invalid 'var' statement: add type or initialize on line ${line}`
      )
    }
    typeCache.set(tokens[1][1], tokens[2][0] as ExprTypes)
    return new VarDecl(parseName(tokens[1], typeCache))
  }
  const expr = parseExpression(tokens.slice(3, endIndex), typeCache)
  typeCache.set(tokens[1][1], expr.type)
  return new VarInit(parseName(tokens[1], typeCache), expr)
}

function parseAssignStatement(tokens: Token[], typeCache: TypeCache): Assign {
  // name = expression ;
  expectToken(tokens[1], 'ASSIGN')
  expectToken(
    tokens[0],
    'NAME',
    `Invalid 'ASSIGN' statement: must assign to a 'NAME'`
  )
  const expr = parseExpression(tokens.slice(2), typeCache)
  typeCache.set(tokens[0][1], expr.type)
  const name = parseName(tokens[0], typeCache)
  return new Assign(name, expr)
}

function parseFuncStatement(tokens: Token[], typeCache: TypeCache): Func {
  // func name ( a , r , g ) { statements }
  expectToken(tokens[0], 'FUNC')
  expectToken(tokens[1], 'NAME')
  expectToken(tokens[2], 'LPAREN')
  // TODO: make this optional somehow
  // if (!(typeTokens as TokenType[]).includes(tokens[3][0])) {
  //   const funcMap = tokens[0][2]
  //   throw new SyntaxError(
  //     `L${funcMap.line}:${funcMap.colStart} - Function definition requires explicit return type`
  //   ) //error(errorString)
  // }
  const parameters = parseParameters(tokens.slice(3), typeCache)
  let typeOrBraceIndex = parameters.length ? parameters.length * 3 + 3 : 4
  if ((typeTokens as TokenType[]).includes(tokens[typeOrBraceIndex][0])) {
    typeCache.set(tokens[1][1], tokens[typeOrBraceIndex][0] as ExprTypes)
    expectToken(tokens[typeOrBraceIndex + 1], 'LBRACE')
    // Need to infer type from return
    // Note to self: We know that if the final statement isn't a return, it'll be return 0 later on
  } else {
    expectToken(tokens[typeOrBraceIndex], 'LBRACE')
    typeOrBraceIndex -= 1 // correct for how I coded it originally
  }
  // TODO: fix function statement parsing by keeping track of opened and closed braces
  // see parseIfElseStatement
  expectToken(
    tokens[tokens.length - 1],
    'RBRACE',
    `Expected token 'RBRACE' at end of function ${tokens[1]}`
  )
  const statements = parseTokens(
    tokens.slice(typeOrBraceIndex + 1, tokens.length - 1) /*, false*/,
    typeCache
  )
  const finalStatement = statements.at(-1)
  if (finalStatement && finalStatement instanceof Return) {
    let typeIdentifier = typeCache.get(tokens[1][1])
    if (typeIdentifier) {
      if (finalStatement.value.type !== typeIdentifier) {
        const map = tokens[1][2]
        throw new SyntaxError(
          `L${map.line}:${map.colStart}-${map.colEnd} - Function return type does not match type specificier '${typeIdentifier}'`
        )
      }
    } else {
      typeCache.set(tokens[1][1], finalStatement.value.type)
    }
  }

  return new Func(parseName(tokens[1], typeCache), parameters, statements)
}

// Doing some weird type things here since TokenType & ExprType are not
// technically overlappable (according to TypeScript)
const typeTokens: ExprTypes[] = ['INTEGER', 'FLOAT'] as const

export function parseParameters(tokens: Token[], typeCache: TypeCache): Name[] {
  if (tokens[0][0] === 'RPAREN') return []
  expectToken(tokens[0], 'NAME')

  const argTokens: Token[] = []
  let n = 0
  for (; tokens[n][0] !== 'RPAREN' && n < tokens.length; n++) {
    const currentToken = tokens[n]
    if (currentToken[0] === 'COMMA') {
      continue
    } else if (currentToken[0] === 'NAME') {
      if (!(typeTokens as TokenType[]).includes(tokens[n + 1][0])) {
        const map = currentToken[2]
        throw new SyntaxError(
          `L${map.line}:${map.colStart}-${map.colEnd} - Invalid parameter ${tokens[n][1]}`
        )
      }
      typeCache.set(currentToken[1], tokens[n + 1][0] as ExprTypes)
      argTokens.push(currentToken)
    }
  }
  expectToken(
    tokens[n],
    'RPAREN',
    `Expected token 'RPAREN' after parameter list, found none`
  )

  return argTokens.map((t) => parseName(t, typeCache))
}

export function parseArguments(
  tokens: Token[],
  typeCache: TypeCache
): Expression[] {
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

  return argTokens.map((t) => parseExpression(t, typeCache))
}

function parseReturnStatement(tokens: Token[], typeCache: TypeCache): Return {
  expectToken(tokens[0], 'RETURN')
  const endIndex = tokens.findIndex(([t]) => t === 'SEMI')
  if (endIndex === -1) {
    throw new SyntaxError(`Expected token 'SEMI' after 'RETURN', found none`)
  }
  const exp = parseExpression(tokens.slice(1, endIndex), typeCache)
  return new Return(exp)
}

const expressionBeginnings: TokenType[] = [
  'NAME', // NAME, CALL, BINOP, COMPARE
  'INTEGER', // INTEGER, BINOP, COMPARE
  'LPAREN', // GROUPING
] as const

export function parseExpression(
  tokens: Token[],
  typeCache: TypeCache
): Expression {
  switch (tokens[0][0]) {
    case 'NAME': {
      //todo: fix call
      if (tokens.length === 1) {
        return parseName(tokens[0], typeCache)
      }
      if (tokens[1][0] === 'LPAREN') {
        return parseCall(tokens, typeCache)
      }
      switch (tokens[1][0]) {
        case 'PLUS':
        case 'TIMES':
        case 'MINUS':
        case 'DIVIDE': {
          return parseBinaryExpression(tokens, typeCache)
        }
        case 'LT':
        case 'EQ':
        case 'LE':
        case 'GT':
        case 'GE':
        case 'NE': {
          return parseCondition(tokens, typeCache)
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
          return parseName(tokens[0], typeCache)
        }
      }
    }
    case 'INTEGER':
    case 'FLOAT': {
      return parseNumber(tokens, typeCache)
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
          parseBinaryExpression(tokens.slice(1, rParenIndex), typeCache),
          parseExpression(tokens.slice(nextOpIndex + 1), typeCache)
        )
      }
      return parseBinaryExpression(tokens.slice(1, rParenIndex), typeCache)
    }
    case 'MINUS': {
      let end = 1
      if (tokens[1][0] === 'LPAREN') {
        end = tokens.findIndex(([t]) => t === 'RPAREN')
        if (end === -1) {
          throw new Error(`Expected token 'RPAREN' after 'LPAREN', found none`)
        }
      }

      const expr = parseExpression(tokens.slice(1, end + 1), typeCache)
      const negate = new Negate(expr, expr.type)

      const maybeOp = tokens.at(end + 1)

      if (maybeOp && [...binOpCodes, ...conditionCodes].includes(maybeOp[0])) {
        return BinaryOperator.fromOp(
          maybeOp[1] as BinOpCodes,
          negate,
          parseExpression(tokens.slice(end + 2), typeCache)
        )
      }
      return negate //new Negate(parseExpression(tokens.slice(1, end + 1)))
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

function parseNumber(
  tokens: Token[],
  typeCache: TypeCache,
  parse: (t: Token) => Integer | Float = parseSingleToken
) {
  if (tokens.length === 1) return parse(tokens[0])
  // Name is too nuanced to fall through this far
  // if (tokens[0][0] === 'NAME' && tokens[1][0] === 'LPAREN') {
  //   return parseCall(tokens, 'INTEGER')
  // }
  if (![...binOpCodes, ...conditionCodes].includes(tokens[1][0])) {
    return parse(tokens[0])
  }
  switch (tokens[1][0]) {
    case 'PLUS':
    case 'TIMES':
    case 'MINUS':
    case 'DIVIDE': {
      return parseBinaryExpression(tokens, typeCache)
    }
    case 'LT':
    case 'EQ':
    case 'LE':
    case 'GT':
    case 'GE':
    case 'NE': {
      return parseCondition(tokens, typeCache)
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
// function parseNumOrName(
//   tokens: Token[],
//   parse: (t: Token) => Integer | Name | Float = parseSingleToken
// ) {
//   if (tokens.length === 1) return parse(tokens[0])
//   if (tokens[0][0] === 'NAME' && tokens[1][0] === 'LPAREN') {
//     return parseCall(tokens, 'INTEGER')
//   }
//   if (![...binOpCodes, ...conditionCodes].includes(tokens[1][0])) {
//     return parse(tokens[0])
//   }
//   switch (tokens[1][0]) {
//     case 'PLUS':
//     case 'TIMES':
//     case 'MINUS':
//     case 'DIVIDE': {
//       return parseBinaryExpression(tokens)
//     }
//     case 'LT':
//     case 'EQ':
//     case 'LE':
//     case 'GT':
//     case 'GE':
//     case 'NE': {
//       return parseCondition(tokens)
//     }
//     case 'IF':
//     case 'ELSE':
//     case 'FUNC':
//     case 'RETURN':
//     case 'VAR':
//     case 'PRINT':
//     case 'WHILE':
//     case 'INTEGER':
//     case 'NAME':
//     case 'ASSIGN':
//     case 'COMMA':
//     case 'SEMI':
//     case 'RPAREN':
//     case 'LBRACE':
//     case 'RBRACE':
//     default: {
//       console.log(`How'd you even get here?`)
//       return parse(tokens[0])
//     }
//   }
// }
function parseSingleToken([type, value, map]: Token): Integer | Float {
  switch (type) {
    // Name by itself is now too nuances
    // case 'NAME':
    //   return new Name(value)

    case 'INTEGER':
      return new Integer(+value)
    case 'FLOAT':
      return new Float(+value)
    default:
      throw new Error(
        `L${map.line}:${map.colStart}-${map.colEnd} - Invalid token type: '${type}'`
      )
  }
}

export function parseInteger(token: Token): Integer {
  expectToken(token, 'INTEGER')
  return new Integer(+token[1])
}

export function parseFloat(token: Token): Float {
  expectToken(token, 'FLOAT')
  return new Float(+token[1])
}

export function parseName(
  [t, name, map]: Token,
  typeCache: Map<string, ExprTypes> /*type: ExprTypes*/
): Name {
  expectToken([t, name, map], 'NAME')
  const type = typeCache.get(name)
  if (!type) {
    throw new Error(
      `L${map.line}:${map.colStart}-${map.colEnd} - Undeclared variable: ${name}`
    )
  }
  return new Name(name, type)
}

export function parseCall(tokens: Token[], typeCache: TypeCache): Call {
  expectToken(tokens[0], 'NAME')
  expectToken(tokens[1], 'LPAREN')
  const args = parseArguments(tokens.slice(2), typeCache)
  // const type = typeCache.get(tokens[0][1])
  // if (!type) {
  //   throw new Error(`Undeclared function type: ${tokens[0][1]}`)
  // }
  return new Call(parseName(tokens[0], typeCache), args)
}

const conditionCodes = ['LT', 'EQ', 'LE', 'GT', 'GE', 'NE']
export function parseCondition(
  tokens: Token[],
  typeCache: TypeCache
): Condition {
  const middleIndex = tokens.findIndex(([t]) => conditionCodes.includes(t))
  if (middleIndex === -1) {
    throw new Error(
      `Invalid condition expression, no 'LT', 'LE', 'GT', 'GE', 'EQ', or 'NE' token found`
    )
  }
  let type: ExprTypes = 'INTEGER'
  const left = parseExpression(tokens.slice(0, middleIndex), typeCache)
  const right = parseExpression(tokens.slice(middleIndex + 1), typeCache)
  if (left.type === 'FLOAT' || right.type === 'FLOAT') {
    type = 'FLOAT'
  }
  // if (left.type === 'INTEGER' && right.type === 'INTEGER') {
  //   type = 'INTEGER'
  // } else if (left.type === 'FLOAT' && right.type === 'FLOAT') {
  //   type = 'FLOAT'
  // } else {
  //   const [, op, map] = tokens[middleIndex]
  //   // const map = tokens[middleIndex][2]
  //   throw new Error(
  //     `L${map.line}:${map.colStart} - Invalid type for '${op}', ${left.type} !== ${right.type}`
  //   )
  // }
  return Condition.fromOp(
    tokens[middleIndex][1] as ConditionCodes,
    left,
    right
    // type
  )
}

const binOpCodes = ['PLUS', 'TIMES', 'MINUS', 'DIVIDE']
export function parseBinaryExpression(tokens: Token[], typeCache: TypeCache) {
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
  let type: ExprTypes = 'INTEGER'
  const left = parseExpression(tokens.slice(0, middleIndex), typeCache)
  const right = parseExpression(tokens.slice(middleIndex + 1), typeCache)
  if (left.type === 'INTEGER' && right.type === 'INTEGER') {
    type = 'INTEGER'
  } else if (left.type === 'FLOAT' && right.type === 'FLOAT') {
    type = 'FLOAT'
  } else {
    const [, op, map] = tokens[middleIndex]
    // const map = tokens[middleIndex][2]
    throw new Error(
      `L${map.line}:${map.colStart} - Invalid type for '${op}', ${left.type} !== ${right.type}`
    )
  }
  return BinaryOperator.fromOp(
    tokens[middleIndex][1] as BinOpCodes,
    left,
    right
    // type
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

type TypeCache = Map<string, ExprTypes>
