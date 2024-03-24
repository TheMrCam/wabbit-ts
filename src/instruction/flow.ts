import {
  Statement,
  IfElse,
  While,
  Func,
  Condition,
  Program,
  GlobalVar,
} from '../ast'
import { BLOCK, GOTO, CBRANCH, cEXPR, RETURN, LABEL } from './instruction'

export const ControlFlow = {
  program: linkProgram,
  statements: linkStatements,
  statement: linkBlocks,
  relabel: relabelBlocks,
}

export function linkProgram(p: Program, newBlockLabel?: () => string): Program {
  let n = 100 // if newBlockLabel isn't passed (shared with Blocks), just start at 100
  const decls: (GlobalVar | Func)[] = []
  for (const s of p.statements) {
    if (s instanceof GlobalVar) {
      decls.push(s)
    } else if (s instanceof Func) {
      const finalBlock = s.statements.at(-1) //[s.statements.length - 1]
      const remainingBlocks = s.statements.slice(0, -1)
      if (finalBlock instanceof BLOCK) {
        if (remainingBlocks.length) {
          decls.push(
            new Func(
              s.name,
              s.parameters,
              linkStatements(
                remainingBlocks, //s.statements.slice(0, -1),
                finalBlock.label,
                newBlockLabel ?? (() => `L${n++}`)
              )
                .reverse()
                .concat([finalBlock])
            )
          )
        } else {
          decls.push(
            new Func(
              s.name,
              s.parameters,
              linkBlocks(
                finalBlock,
                finalBlock.label,
                newBlockLabel ?? (() => `L${n++}`)
              ).reverse()
            )
          )
        }
      } else {
        decls.push(s)
      }
    } else {
      throw new Error('Invalid statement passed to block linker')
    }
  }
  const program = new Program(decls)
  return program
}

function linkStatements(
  statements: Statement[],
  nextBlockLabel: LABEL,
  newBlockLabel: () => string
): BLOCK[] {
  if (!statements.length) {
    return [new BLOCK(new LABEL(newBlockLabel()), [new GOTO(nextBlockLabel)])]
  }
  const blocks: BLOCK[] = []
  for (const s of statements.slice().reverse()) {
    blocks.push(...linkBlocks(s, nextBlockLabel, newBlockLabel))
    nextBlockLabel = blocks.at(-1)?.label ?? nextBlockLabel
  }
  return blocks
}

function linkBlocks(
  s: Statement,
  nextBlockLabel: LABEL,
  newBlockLabel: () => string
): BLOCK[] {
  if (s instanceof BLOCK) {
    const lastInstruction = s.instructions.at(-1)
    if (
      lastInstruction instanceof RETURN ||
      lastInstruction instanceof GOTO ||
      lastInstruction instanceof CBRANCH
    ) {
      nextBlockLabel = s.label
      return [s]
    }
    return [new BLOCK(s.label, [...s.instructions, new GOTO(nextBlockLabel)])]
  } else if (s instanceof IfElse) {
    const ifTrueBlocks = linkStatements(s.ifTrue, nextBlockLabel, newBlockLabel)
    const ifFalseBlocks = linkStatements(
      s.ifFalse,
      nextBlockLabel,
      newBlockLabel
    )

    const conditionBlock = createConditionalBlock(
      s.condition,
      ifTrueBlocks[ifTrueBlocks.length - 1].label,
      ifFalseBlocks[ifFalseBlocks.length - 1].label,
      new LABEL(newBlockLabel())
    )
    return [...ifFalseBlocks, ...ifTrueBlocks, conditionBlock]
  } else if (s instanceof While) {
    const testLabel = new LABEL(newBlockLabel())
    const bodyBlocks = linkStatements(s.statements, testLabel, newBlockLabel)
    const conditionBlock = createConditionalBlock(
      s.condition,
      bodyBlocks[bodyBlocks.length - 1].label,
      nextBlockLabel,
      testLabel
    )
    return [...bodyBlocks, conditionBlock]
  } else {
    return [s] as BLOCK[]
  }
}

function createConditionalBlock(
  c: Condition,
  leftLabel: LABEL,
  rightLabel: LABEL,
  blockLabel: LABEL
): BLOCK {
  if (!(c instanceof cEXPR)) {
    throw new Error(
      `Unable to process '${c.constructor.name}', expected 'cEXPR'`
    )
  }
  return new BLOCK(blockLabel, [
    ...c.instructions,
    new CBRANCH(leftLabel, rightLabel),
  ])
}

// Taking advantage of Object mutability and my special LABEL class
function relabelBlocks(p: Program): Program {
  let n = 0
  const genLabel = () => `L${n++}`
  p.statements.forEach((s) => relabelBlock(s, genLabel))
  return p
}

function relabelBlock(statement: Statement, genLabelName: () => string): void {
  if (statement instanceof BLOCK) {
    statement.label.value = genLabelName()
  } else if (statement instanceof Func) {
    statement.statements.forEach((s) => relabelBlock(s, genLabelName))
  }
}
