import { Compiler as C } from './compile'
import { Format } from './format'
import { parseFile } from './parse'
import { GenerateLLVM, EntryLLVM } from './instruction'
import { Program } from './ast'

/**
 * This test exists to display the pretty formatted code for each stage
 * of the compiler, so you can see what's happening and maybe aid in debugging.
 *
 * This test is ignored with the regular 'npm run test' script to keep stdout
 * clean, so there's a separate script 'npm run printPhases' that targets just
 * this test suite.
 *
 * Tip: run `npm run printPhases` to run vitest in watch mode, then press t to
 * filter, then type a phase name (like 'fold') to isolate that phase.
 */
describe('print compiled stages', { concurrent: false }, () => {
  const program = parseFile('wabbit/tests/floats.wb', true)
  test('parsed', () => {
    console.log(Format.program(program))
  })

  const fold = (p: Program) => C.Fold(p)
  test('fold', () => {
    console.log(Format.program(fold(program)))
  })

  const deinit = (p: Program) => C.Deinit(fold(p))
  test('deinit', () => {
    console.log(Format.program(deinit(program)))
  })

  const resolve = (p: Program) => C.Resolve(deinit(p))
  test('resolve', () => {
    console.log(Format.program(resolve(program)))
  })

  const unscript = (p: Program) => C.Unscript(resolve(p))
  test('unscript', () => {
    console.log(Format.program(unscript(program)))
  })

  const returns = (p: Program) => C.Returns(unscript(p))
  test('returns', () => {
    console.log(Format.program(returns(program)))
  })

  const negate = (p: Program) => C.Negate(returns(p))
  test('negate', () => {
    console.log(Format.program(negate(program)))
  })

  const expressions = (p: Program) => C.Expressions(negate(p))
  test('expressions', () => {
    console.log(Format.program(expressions(program)))
  })

  const statements = (p: Program) => C.Statements(expressions(p))
  test('statements', () => {
    console.log(Format.program(statements(program)))
  })

  const blocks = (p: Program, l?: () => string) => C.Blocks(statements(p), l)
  test('blocks', () => {
    console.log(Format.program(blocks(program)))
  })

  const flow = (p: Program) => {
    let n = 0
    const newBlockLabel = () => `L${n++}`
    return C.Flow(blocks(p, newBlockLabel), newBlockLabel)
  }
  test('flow', () => {
    console.log(Format.program(flow(program)))
  })

  const relabel = (p: Program) => C.Relabel(flow(p))
  test('relabel', () => {
    console.log(Format.program(relabel(program)))
  })

  const llvmGen = (p: Program) => GenerateLLVM.program(relabel(p))
  test('llvm gen', () => {
    console.log(Format.program(llvmGen(program)))
  })

  const llvmEntry = (p: Program) => EntryLLVM.program(llvmGen(p))
  test('llvm entry', () => {
    console.log(Format.program(llvmEntry(program)))
  })

  test('llvm format', () => {
    console.log(Format.program(llvmEntry(program), true))
  })
})
