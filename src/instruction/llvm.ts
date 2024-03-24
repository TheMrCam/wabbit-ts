import { ExprTypes, Func, Program, Statement } from '../ast'
import {
  ADD,
  BLOCK,
  CALL,
  CBRANCH,
  DIV,
  EQ,
  GE,
  GOTO,
  GT,
  Instruction,
  LE,
  LLVM_BLOCK,
  LOAD_GLOBAL,
  LOAD_LOCAL,
  LOCAL,
  LT,
  MUL,
  NE,
  PRINT,
  PUSH,
  REGISTER,
  RETURN,
  STORE_GLOBAL,
  STORE_LOCAL,
  SUB,
  TypelessInstruction,
  typeToLLVM,
} from './instruction'

export const GenerateLLVM = {
  program: (p: Program) => new Program(generateLLVM(p.statements)),
}
export type Stack = [REGISTER | number, type: ExprTypes][]

type RegisterGenerator = () => REGISTER

export function generateLLVM(
  statements: Statement[],
  generateRegister?: RegisterGenerator
): Statement[] {
  let r = 0
  generateRegister ??= () => new REGISTER(`%r${r++}`)
  return statements.map((s) =>
    convertStatement(s, generateRegister as RegisterGenerator)
  )
}

export function convertStatement(
  s: Statement,
  generateRegister: RegisterGenerator
): Statement {
  if (s instanceof Func) {
    return new Func(
      s.name,
      s.parameters,
      generateLLVM(s.statements, generateRegister)
    )
  } else if (s instanceof BLOCK) {
    return new LLVM_BLOCK(
      s.label,
      convertInstructions(s.instructions, generateRegister)
    )
  } else {
    return s
  }
}

export function convertInstructions(
  instructions: (TypelessInstruction | Instruction)[],
  generateRegister: RegisterGenerator
): string[] {
  const stack: Stack = []
  return instructions
    .map((i) => convertInstruction(i, stack, generateRegister))
    .filter<string>((s): s is string => typeof s === 'string')
}

export function convertInstruction(
  inst: TypelessInstruction | Instruction,
  stack: Stack,
  generateRegister: () => REGISTER
): string | undefined {
  if (inst instanceof PUSH) {
    stack.push([inst.value, inst.type])
    return
  } else if (
    inst instanceof ADD ||
    inst instanceof MUL ||
    inst instanceof SUB ||
    inst instanceof DIV ||
    inst instanceof LT ||
    inst instanceof LE ||
    inst instanceof GT ||
    inst instanceof GE ||
    inst instanceof EQ ||
    inst instanceof NE
  ) {
    const right = stack.pop()
    const left = stack.pop()
    const result = generateRegister()
    stack.push([result, inst.type])
    return inst.code(result, left?.[0], right?.[0])
  } else if (inst instanceof LOCAL) {
    return `%${inst.value} = alloca ${
      inst.type === 'INTEGER' ? 'i32' : 'double'
    }`
  } else if (inst instanceof LOAD_LOCAL || inst instanceof LOAD_GLOBAL) {
    const result = generateRegister()
    stack.push([result, inst.type])
    return inst.code(result)
  } else if (inst instanceof GOTO) {
    return `br label %${inst.label}`
  } else if (inst instanceof CBRANCH) {
    return `br i1 ${stack.pop()?.[0]}, label %${inst.left}, label %${
      inst.right
    }`
  } else if (
    inst instanceof PRINT ||
    inst instanceof RETURN ||
    inst instanceof STORE_LOCAL ||
    inst instanceof STORE_GLOBAL
  ) {
    return inst.code(stack.pop()?.[0])
  } else if (inst instanceof CALL) {
    const args = stack.splice(-inst.n)
    const signature = `${typeToLLVM(inst.type)} (${args
      .map(([, type]) => typeToLLVM(type))
      .join(', ')})`
    const result = generateRegister()
    stack.push([result, inst.type])
    return `${result} = call ${signature} @${inst.name}(${args
      .map(([a, t]) => `${typeToLLVM(t)} ${a}`)
      .join(', ')})`
  } else {
    throw new Error(`Invalid instruction '${inst.constructor.name}'`)
  }
}
