import { BLOCK, STATEMENT, LABEL } from './instruction'
import { Func, IfElse, Program, Statement, While } from '../ast'

export const Blocks = {
  program: blockProgram,
  statements: statementsToBlocks,
}

export function blockProgram(
  p: Program,
  generateLabel?: () => string
): Program {
  let n = 0
  return new Program(
    statementsToBlocks(p.statements, generateLabel ?? (() => `L${n++}`))
  )
}

export function statementsToBlocks(
  statements: Statement[],
  generateLabel: () => string
): Statement[] {
  const result: Statement[] = []
  for (const s of statements) {
    if (s instanceof STATEMENT) {
      const lastAdded = result[result.length - 1]
      if (lastAdded instanceof BLOCK) {
        lastAdded.instructions.push(...s.instructions)
      } else {
        result.push(new BLOCK(new LABEL(generateLabel()), s.instructions))
      }
    } else if (s instanceof IfElse) {
      result.push(
        new IfElse(
          s.condition,
          statementsToBlocks(s.ifTrue, generateLabel),
          statementsToBlocks(s.ifFalse, generateLabel)
        )
      )
    } else if (s instanceof While) {
      result.push(
        new While(s.condition, statementsToBlocks(s.statements, generateLabel))
      )
    } else if (s instanceof Func) {
      result.push(
        new Func(
          s.name,
          s.parameters,
          statementsToBlocks(s.statements, generateLabel)
        )
      )
    } else {
      result.push(s)
    }
  }
  return result
}
