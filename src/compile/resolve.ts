import {
  AllStatements,
  Assign,
  BinaryOperator,
  Call,
  Condition,
  ExprStatement,
  Expression,
  Func,
  GlobalName,
  GlobalVar,
  IfElse,
  LocalName,
  LocalVar,
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
import { DeinitProgram } from './deinit'

type ResolveStatement = Exclude<AllStatements, VarInit | Name>
export type ResolveProgram = Program<ResolveStatement>

export const Resolve = {
  program: resolveProgram,
  statement: resolveStatement,
}

export function resolveProgram(
  program: DeinitProgram,
  logUndeclared = false
): ResolveProgram {
  const global: GlobalName[] = []
  const local: LocalName[] = []
  const statements: ResolveStatement[] = []
  for (const s of program.statements) {
    statements.push(resolveStatement(s, global, local, logUndeclared))
  }
  return new Program(statements)
}

export function resolveStatement(
  s: Statement,
  global: GlobalName[],
  local: LocalName[],
  debug = false
): ResolveStatement {
  const resolveName = debug
    ? (name: Name) => {
        const foundLocal = local.find((n) => n.value === name.value)
        if (foundLocal) return foundLocal
        const foundGlobal = global.find((n) => n.value === name.value)
        if (foundGlobal) return foundGlobal
        console.error(`Undeclared variable: ${name.value}`)
        return new GlobalName(name.value, name.type)
      }
    : (name: Name) => {
        const foundLocal = local.find((n) => n.value === name.value)
        if (foundLocal) return foundLocal
        const foundGlobal = global.find((n) => n.value === name.value)
        if (foundGlobal) return foundGlobal
        return new GlobalName(name.value, name.type)
      }
  if (s instanceof VarDecl) {
    const name = new GlobalName(s.name.value, s.name.type)
    global.push(name)
    return new GlobalVar(name)
  } else if (s instanceof Assign) {
    return new Assign(
      resolveName(s.name),
      resolveExpression(s.value, global, local, resolveName)
    )
  } else if (s instanceof Func) {
    const name = new GlobalName(s.name.value, s.returnType)
    global.push(name)
    const parameters = s.parameters.map((n) => new LocalName(n.value, n.type))
    const inners: Statement[] = []
    const newLocal = [...local, ...parameters]
    for (const statement of s.statements) {
      inners.push(resolveInnerStatement(statement, global, newLocal))
    }
    return new Func(name, parameters, inners)
  } else if (s instanceof Print) {
    return new Print(resolveExpression(s.value, global, local, resolveName))
  } else if (s instanceof IfElse) {
    const ifTrue: Statement[] = []
    const trueLocal = [...local]
    for (const statement of s.ifTrue) {
      ifTrue.push(resolveInnerStatement(statement, global, trueLocal))
    }
    const ifFalse: Statement[] = []
    const falseLocal = [...local]
    for (const statement of s.ifFalse) {
      ifFalse.push(resolveInnerStatement(statement, global, falseLocal))
    }
    return new IfElse(
      resolveExpression(s.condition, global, local, resolveName),
      ifTrue,
      ifFalse
    )
  } else if (s instanceof While) {
    const statements: Statement[] = []
    const newLocal = [...local]
    for (const statement of s.statements) {
      statements.push(resolveInnerStatement(statement, global, newLocal))
    }
    return new While(
      resolveExpression(s.condition, global, local, resolveName),
      statements
    )
  } else if (s instanceof Return) {
    return new Return(resolveExpression(s.value, global, local, resolveName))
  } else if (s instanceof ExprStatement) {
    return new ExprStatement(
      resolveExpression(s.expression, global, local, resolveName)
    )
  } else {
    throw new Error('Misunderstood statement')
  }
}

function resolveInnerStatement(
  s: Statement,
  global: GlobalName[],
  local: LocalName[]
): Statement {
  if (s instanceof VarDecl) {
    const name = new LocalName(s.name.value, s.name.type)
    local.push(name)
    return new LocalVar(name)
  } else if (s instanceof Func) {
    const name = new LocalName(s.name.value, s.returnType)
    local.push(name)
    const parameters = s.parameters.map((n) => new LocalName(n.value, n.type))
    const inners: Statement[] = []
    const newLocals = [...local, ...parameters]
    for (const inner of s.statements) {
      inners.push(resolveInnerStatement(inner, global, newLocals))
    }
    return new Func(name, parameters, inners)
  } else {
    return resolveStatement(s, global, local)
  }
}

function resolveExpression(
  e: Condition,
  global: Name[],
  local: Name[],
  resolveName?: (n: Name) => LocalName | GlobalName
): Condition
function resolveExpression(
  e: BinaryOperator,
  global: Name[],
  local: Name[],
  resolveName?: (n: Name) => LocalName | GlobalName
): BinaryOperator
function resolveExpression(
  e: Expression,
  global: Name[],
  local: Name[],
  resolveName?: (n: Name) => LocalName | GlobalName
): Expression
function resolveExpression(
  e: Expression,
  global: GlobalName[],
  local: LocalName[],
  // TODO: watch this to make sure defining the function in/before the parameters doesn't break things
  resolveName = (name: Name) => {
    const foundLocal = local.find((n) => n.value === name.value)
    if (foundLocal) return foundLocal
    const foundGlobal = global.find((n) => n.value === name.value)
    if (foundGlobal) return foundGlobal
    return new GlobalName(name.value, name.type)
  }
): Expression | Condition | BinaryOperator {
  if (e instanceof Name) {
    return resolveName(e)
  } else if (e instanceof BinaryOperator) {
    return BinaryOperator.fromOp(
      e.op,
      resolveExpression(e.left, global, local),
      resolveExpression(e.right, global, local)
    )
  } else if (e instanceof Condition) {
    return Condition.fromOp(
      e.op,
      resolveExpression(e.left, global, local),
      resolveExpression(e.right, global, local)
    )
  } else if (e instanceof Call) {
    return new Call(
      e.function,
      e.arguments.map((exp) => resolveExpression(exp, global, local))
    )
  } else if (e instanceof Negate) {
    return new Negate(resolveExpression(e.expression, global, local), e.type)
  } else {
    return e
  }
}
