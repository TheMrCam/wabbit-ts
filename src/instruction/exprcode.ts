import {
  ADD,
  CALL,
  EQ,
  EXPR,
  Instruction,
  LOAD_GLOBAL,
  LOAD_LOCAL,
  LT,
  MUL,
  PUSH,
  bEXPR,
  cEXPR,
} from '.'
import {
  Add,
  Assign,
  BinaryOperator,
  Call,
  Condition,
  Equals,
  ExprStatement,
  ExprTypes,
  Expression,
  Float,
  Func,
  GlobalName,
  GlobalVar,
  IfElse,
  Integer,
  LessThan,
  LocalName,
  LocalVar,
  Multiply,
  Name,
  Print,
  Program,
  Return,
  Statement,
  While,
} from '../ast'

export const Expressions = {
  program: (p: Program) =>
    new Program(p.statements.map(statementExprInstructions)),
}

export function statementExprInstructions(s: Statement): Statement {
  if (s instanceof Print) {
    return new Print(expressionInstructions(s.value))
  } else if (s instanceof Return) {
    return new Return(expressionInstructions(s.value))
  } else if (s instanceof ExprStatement) {
    return new ExprStatement(expressionInstructions(s.expression))
  } else if (s instanceof Assign) {
    return new Assign(s.name, expressionInstructions(s.value))
  } else if (s instanceof IfElse) {
    return new IfElse(
      generateConditionExpr(s.condition),
      s.ifTrue.map(statementExprInstructions),
      s.ifFalse.map(statementExprInstructions)
    )
  } else if (s instanceof While) {
    return new While(
      generateConditionExpr(s.condition),
      s.statements.map(statementExprInstructions)
    )
  } else if (s instanceof Func) {
    return new Func(
      s.name,
      s.parameters,
      s.statements.map(statementExprInstructions)
    )
  } else if (s instanceof LocalVar) {
    return s
  } else if (s instanceof GlobalVar) {
    return s
  } else {
    throw new Error(`Unable to generate code for ${s}`)
  }
}

// TODO: figure out Name expressions
export function expressionInstructions(expr: Expression): EXPR {
  if (expr instanceof Integer || expr instanceof Float) {
    return new EXPR([new PUSH(expr.value, expr.type)])
  } else if (expr instanceof BinaryOperator) {
    return generateBinExpr(expr)
  } else if (expr instanceof Condition) {
    return generateConditionExpr(expr)
  } else if (expr instanceof LocalName) {
    return new EXPR([new LOAD_LOCAL(expr.value, expr.type)])
  } else if (expr instanceof GlobalName) {
    return new EXPR([new LOAD_GLOBAL(expr.value, expr.type)])
  } else if (expr instanceof Call) {
    return new EXPR([
      ...expr.arguments.reduce<Instruction[]>(
        (acc, e) => [...acc, ...expressionInstructions(e).instructions],
        []
      ),
      new CALL(expr.function.value, expr.arguments.length, expr.function.type),
    ])
  } else {
    throw new Error(`Unable to generate code for ${expr}`)
  }
}

function generateBinExpr(expr: BinaryOperator) {
  return new bEXPR(
    expr.op,
    expressionInstructions(expr.left),
    expressionInstructions(expr.right),
    expr.type
  )
}

function generateConditionExpr(expr: Condition) {
  let type: ExprTypes = 'INTEGER'
  if (expr.left.type === 'FLOAT' || expr.right.type === 'FLOAT') {
    type = 'FLOAT'
  }
  return new cEXPR(
    expr.op,
    expressionInstructions(expr.left),
    expressionInstructions(expr.right),
    type
  )
}
