import { Program } from '../ast'
import { Fold } from './fold'
import { Deinit } from './deinit'
import { Resolve } from './resolve'
import { Returns } from './returns'
import { Unscript } from './unscript'
import { RemoveNegate as Negate } from './negate'
import {
  Expressions,
  Statements,
  Blocks,
  ControlFlow,
  GenerateLLVM,
  EntryLLVM,
} from '../instruction'

export function compile(program: Program): Program {
  let n = 0
  const blockLabel = () => `L${n++}`
  return EntryLLVM.program(
    GenerateLLVM.program(
      ControlFlow.relabel(
        ControlFlow.program(
          Blocks.program(
            Statements.program(
              Expressions.program(
                Negate.program(
                  Returns.program(
                    Unscript.program(
                      Resolve.program(Deinit.program(Fold.program(program)))
                    )
                  )
                )
              )
            ),
            blockLabel
          ),
          blockLabel
        )
      )
    )
  )
}

export const Compiler = {
  Fold: Fold.program,
  Deinit: Deinit.program,
  Resolve: Resolve.program,
  Returns: Returns.program,
  Unscript: Unscript.program,
  Negate: Negate.program,
  Expressions: Expressions.program,
  Statements: Statements.program,
  Blocks: Blocks.program,
  Flow: ControlFlow.program,
  Relabel: ControlFlow.relabel,
  LLVM: (p: Program) => EntryLLVM.program(GenerateLLVM.program(p)),
}
