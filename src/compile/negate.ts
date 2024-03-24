import {
  Assign,
  BinaryOperator,
  Call,
  Condition,
  Expression,
  Float,
  Func,
  GlobalVar,
  IfElse,
  Integer,
  Negate,
  Print,
  Program,
  Return,
  Statement,
  Subtract,
  While,
} from '../ast'
import { UnscriptProgram } from './unscript'

export const RemoveNegate = {
  program: (p: UnscriptProgram): UnscriptProgram =>
    new Program(p.statements.map(topLevelNegate)),
}

export function topLevelNegate(s: Func | GlobalVar): Func | GlobalVar {
  if (s instanceof Func) {
    return new Func(
      s.name,
      // s.returnType,
      s.parameters,
      s.statements.map(removeNegateStatement)
    )
  } else return s
}

export function removeNegateStatement(s: Statement): Statement {
  if (s instanceof Assign) {
    return new Assign(s.name, removeNegateExpression(s.value))
  } else if (s instanceof Print) {
    return new Print(removeNegateExpression(s.value))
  } else if (s instanceof Return) {
    return new Return(removeNegateExpression(s.value))
  } else if (s instanceof IfElse) {
    return new IfElse(
      removeNegateCondition(s.condition),
      s.ifTrue.map(removeNegateStatement),
      s.ifFalse.map(removeNegateStatement)
    )
  } else if (s instanceof While) {
    return new While(
      removeNegateCondition(s.condition),
      s.statements.map(removeNegateStatement)
    )
  } else if (s instanceof Func) {
    return new Func(
      s.name,
      // s.returnType,
      s.parameters,
      s.statements.map(removeNegateStatement)
    )
  } else return s
}

export function removeNegateExpression(e: Expression): Expression {
  if (e instanceof Negate) {
    // if(e.expression.type === 'FLOAT') {}
    switch (e.expression.type) {
      case 'INTEGER':
        return new Subtract(new Integer(0), e.expression)
      case 'FLOAT':
        return new Subtract(new Float(0), e.expression)
    }
    return new Subtract(new Integer(0), e.expression)
  } else if (e instanceof BinaryOperator) {
    return removeNegateBinary(e)
  } else if (e instanceof Condition) {
    return removeNegateCondition(e)
  } else if (e instanceof Call) {
    return new Call(e.function, e.arguments.map(removeNegateExpression))
  } else return e
}

export function removeNegateCondition(c: Condition): Condition {
  return Condition.fromOp(
    c.op,
    removeNegateExpression(c.left),
    removeNegateExpression(c.right)
    // c.type
  )
}
export function removeNegateBinary(b: BinaryOperator): BinaryOperator {
  return BinaryOperator.fromOp(
    b.op,
    removeNegateExpression(b.left),
    removeNegateExpression(b.right)
    // b.type
  )
}
