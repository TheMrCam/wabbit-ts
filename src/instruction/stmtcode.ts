import {
  Assign,
  ExprStatement,
  Func,
  GlobalName,
  IfElse,
  LocalName,
  LocalVar,
  Print,
  Program,
  Return,
  Statement,
  While,
} from '../ast'
import {
  EXPR,
  LOCAL,
  PRINT,
  RETURN,
  STATEMENT,
  STORE_GLOBAL,
  STORE_LOCAL,
} from '.'

export const Statements = {
  program: (p: Program) => new Program(generateStatements(p.statements)),
}

export function generateStatements(statements: Statement[]) {
  return statements.map(statementInstructions)
}

export function statementInstructions(s: Statement): Statement {
  if (s instanceof Print && s.value instanceof EXPR) {
    return new STATEMENT([...s.value.instructions, new PRINT(s.value.type)])
  } else if (s instanceof Return && s.value instanceof EXPR) {
    return new STATEMENT([...s.value.instructions, new RETURN(s.value.type)])
  } else if (s instanceof ExprStatement && s.expression instanceof EXPR) {
    return new STATEMENT([...s.expression.instructions])
  } else if (s instanceof LocalVar) {
    return new STATEMENT([new LOCAL(s.name.value, s.name.type)])
  } else if (s instanceof Assign && s.value instanceof EXPR) {
    if (s.name instanceof LocalName) {
      return new STATEMENT([
        ...s.value.instructions,
        new STORE_LOCAL(s.name.value, s.name.type),
      ])
    }
    return new STATEMENT([
      ...s.value.instructions,
      new STORE_GLOBAL(s.name.value, s.name.type),
    ])
  } else if (s instanceof IfElse) {
    return new IfElse(
      s.condition,
      s.ifTrue.map(statementInstructions),
      s.ifFalse.map(statementInstructions)
    )
  } else if (s instanceof While) {
    return new While(s.condition, s.statements.map(statementInstructions))
  } else if (s instanceof Func) {
    return new Func(
      s.name,
      s.parameters,
      s.statements.map(statementInstructions)
      // s.returnType
    )
  } else {
    return s
  }
}
