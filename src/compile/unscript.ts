import {
  AllStatements,
  Func,
  GlobalName,
  GlobalVar,
  Program,
  Statement,
  VarDecl,
} from '../ast'
import { ResolveProgram } from './resolve'

type UnscriptStatement = GlobalVar | Func
export type UnscriptProgram = Program<UnscriptStatement>

export const Unscript = { program: unscriptProgram }

export function unscriptProgram(program: ResolveProgram): UnscriptProgram {
  const main: Statement[] = []
  const statements: UnscriptStatement[] = []
  for (const statement of program.statements) {
    if (statement instanceof GlobalVar || statement instanceof Func) {
      statements.push(statement)
    } else {
      main.push(statement)
    }
  }
  statements.push(new Func(new GlobalName('main', 'INTEGER'), undefined, main))
  return new Program(statements)
}
