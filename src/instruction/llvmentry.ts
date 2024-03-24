import { Func, Program, Statement } from '../ast'
import { BLOCK, LLVM_BLOCK } from './instruction'

export const EntryLLVM = {
  program: (p: Program) => new Program(addEntryBlocks(p.statements)),
  statements: addEntryBlocks,
  statement: addEntryBlock,
}

export function addEntryBlocks(s: Statement[]): Statement[] {
  return s.map((s) => (s instanceof Func ? addEntryBlock(s) : s))
}

export function addEntryBlock(f: Func): Func {
  if (!f.parameters.length) return f
  const args = f.parameters.map((n) => {
    n.value = `.arg_${n.value}`
    return n
  })
  const oldEntry = f.statements[0]
  if (oldEntry instanceof BLOCK || oldEntry instanceof LLVM_BLOCK) {
    const entryInstructions = args
      .reduce<string[]>((acc, arg) => {
        const oldName = arg.value.substring(5)
        const type = arg.type === 'INTEGER' ? 'i32' : 'double'
        return [
          ...acc,
          `%${oldName} = alloca ${type}`,
          `store ${type} %${arg.value}, ${type}* %${oldName}`,
        ]
      }, [])
      .concat(`br label %${oldEntry.label}`)
    const entryBlock = new LLVM_BLOCK('entry', entryInstructions)
    return new Func(f.name, args, [entryBlock, ...f.statements])
  } else {
    return f
  }
  // return new Func(
  //   f.name,
  //   f.parameters.map((n) => {
  //     n.value = `.arg_${n.value}`
  //     return n
  //   })
  // )
}
