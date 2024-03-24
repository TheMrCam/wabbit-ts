import { Func, GlobalVar, Integer, Program, Return, Statement } from '../ast'
import { UnscriptProgram } from './unscript'

export const Returns = { program: addReturns }

export function addReturns(program: UnscriptProgram): UnscriptProgram {
  return new Program(program.statements.map(addReturn))
}

function addReturn(s: Func | GlobalVar): Func | GlobalVar {
  if (!(s instanceof Func)) {
    return s
  }
  if (s.statements.at(-1) instanceof Return) {
    return s
  }

  // TODO: check for possible if { return } else { return }
  return new Func(
    s.name,
    s.parameters,
    s.statements.concat([new Return(new Integer(0))])
  )
}
