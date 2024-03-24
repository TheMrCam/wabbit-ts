import {
  Program,
  Statement,
  Expression,
  BinaryOperator,
  Integer,
  VarInit,
  Assign,
  Print,
  IfElse,
  While,
  Condition,
  Func,
  Return,
  ExprStatement,
  Float,
} from '../ast'

// All statements are still valid and in-place
export type FoldProgram = Program

export const Fold = {
  program: foldConstants,
  statements: foldStatements,
  statement: foldStatement,
  expression: foldExpression,
}

export function foldConstants(program: Program): FoldProgram {
  return new Program(foldStatements(program.statements))
}

function foldStatements(statements: Statement[]): Statement[] {
  return statements.map(foldStatement)
}

function foldStatement(s: Statement): Statement {
  if (s instanceof VarInit) {
    return new VarInit(s.name, foldExpression(s.value))
  } else if (s instanceof Assign) {
    return new Assign(s.name, foldExpression(s.value))
  } else if (s instanceof Print) {
    return new Print(foldExpression(s.value))
  } else if (s instanceof IfElse) {
    return new IfElse(
      foldCondition(s.condition),
      foldStatements(s.ifTrue),
      foldStatements(s.ifFalse)
    )
  } else if (s instanceof While) {
    return new While(foldCondition(s.condition), foldStatements(s.statements))
  } else if (s instanceof Func) {
    return new Func(s.name, s.parameters, foldStatements(s.statements))
  } else if (s instanceof Return) {
    return new Return(foldExpression(s.value))
  } else if (s instanceof ExprStatement) {
    return new ExprStatement(foldExpression(s.expression))
  } else {
    return s // statement doesn't need to be folded (like VarDecl)
  }
}

function foldExpression(e: Expression): Expression {
  if (e instanceof BinaryOperator) {
    return foldBinaryOperator(e)
  } else if (e instanceof Condition) {
    return foldCondition(e)
  } else {
    return e
  }
}

function foldBinaryOperator({ left, right, op }: BinaryOperator): Expression {
  if (left instanceof BinaryOperator) {
    left = foldBinaryOperator(left)
  }
  if (right instanceof BinaryOperator) {
    right = foldBinaryOperator(right)
  }
  if (left instanceof Integer && right instanceof Integer) {
    return new Integer(Math.floor(opCodes[op](left.value, right.value)))
  }
  if (left instanceof Float && right instanceof Float) {
    return new Float(opCodes[op](left.value, right.value))
  }
  return BinaryOperator.fromOp(op, left, right)
}

function foldCondition(e: Condition): Condition {
  let { left, right, op } = e
  if (left instanceof BinaryOperator) {
    left = foldBinaryOperator(left)
  }
  if (right instanceof BinaryOperator) {
    right = foldBinaryOperator(right)
  }
  return Condition.fromOp(op, left, right)
}

const opCodes = {
  '+': (l: number, r: number) => l + r,
  '*': (l: number, r: number) => l * r,
  '-': (l: number, r: number) => l - r,
  '/': (l: number, r: number) => l / r,
}
