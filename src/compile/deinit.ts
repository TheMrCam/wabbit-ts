import {
  AllStatements,
  Assign,
  Func,
  IfElse,
  Program,
  Statement,
  VarDecl,
  VarInit,
  While,
} from '../ast'
import { FoldProgram } from './fold'

type DeinitStatement = Exclude<AllStatements, VarInit>
export type DeinitProgram = Program<DeinitStatement>

export const Deinit = {
  program: deinitProgram,
  statements: deinitStatements,
  statement: deinitStatement,
}

export function deinitProgram(program: FoldProgram): DeinitProgram {
  return new Program(deinitStatements(program.statements))
}

function deinitStatements(statements: Statement[]): DeinitStatement[] {
  return statements.flatMap(deinitStatement)
}

function deinitStatement(s: Statement): DeinitStatement | DeinitStatement[] {
  if (s instanceof VarInit) {
    return [new VarDecl(s.name), new Assign(s.name, s.value)]
  } else if (s instanceof IfElse) {
    return new IfElse(
      s.condition,
      deinitStatements(s.ifTrue),
      deinitStatements(s.ifFalse)
    )
  } else if (s instanceof While) {
    return new While(s.condition, deinitStatements(s.statements))
  } else if (s instanceof Func) {
    return new Func(
      s.name,
      // s.returnType,
      s.parameters,
      deinitStatements(s.statements)
    )
  } else {
    // this is fine because we turned VarInit into VarDecl above
    return s as DeinitStatement
  }
}
