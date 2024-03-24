import {
  BinOpCodes,
  BinaryOperator,
  Condition,
  ConditionCodes,
  ExprTypes,
  Expression,
  Statement,
} from '../ast'

export abstract class TypelessInstruction {}
export abstract class Instruction extends TypelessInstruction {
  abstract type: ExprTypes
}

const formatNumber = (
  type: ExprTypes,
  num?: number | REGISTER
): string | undefined => {
  // if(type === 'INTEGER') return num
  // if
  switch (type) {
    case 'INTEGER':
      return num?.toString()
    case 'FLOAT': {
      if (typeof num !== 'number') return num?.toString()
      if (num.toString().includes('.')) {
        return num.toString()
      } else return num.toFixed(1)
    }
  }
}

type ThreeAddressCode = (
  result: REGISTER,
  left?: REGISTER | number,
  right?: REGISTER | number
) => string
export const typeToLLVM = (t: ExprTypes, prefix?: string, suffix?: string) => {
  switch (t) {
    case 'INTEGER':
      return `${prefix ?? ''}i32${suffix ?? ''}`
    case 'FLOAT':
      return `${prefix ?? ''}double${suffix ?? ''}`
    case null:
      throw new Error(`Invalid type `)
  }
}

export class PUSH implements Instruction {
  value: number
  type: ExprTypes
  constructor(value: number, type?: ExprTypes) {
    this.value = value
    this.type = type ?? Number.isInteger(value) ? 'INTEGER' : 'FLOAT'
  }
}

export class ADD implements Instruction {
  type: ExprTypes
  code: ThreeAddressCode = (result, l, r) =>
    `${result} = ${
      this.type === 'INTEGER' ? 'add i32' : 'fadd double'
    } ${formatNumber(this.type, l)}, ${formatNumber(this.type, r)}`
  constructor(type: ExprTypes) {
    this.type = type
  }
}
export class MUL implements Instruction {
  type: ExprTypes
  code: ThreeAddressCode = (result, l, r) =>
    `${result} = ${
      this.type === 'INTEGER' ? 'mul i32' : 'fmul double'
    } ${formatNumber(this.type, l)}, ${formatNumber(this.type, r)}`
  constructor(type: ExprTypes) {
    this.type = type
  }
}
export class SUB implements Instruction {
  type: ExprTypes
  code: ThreeAddressCode = (result, l, r) => {
    return `${result} = ${
      this.type === 'INTEGER' ? 'sub i32' : 'fsub double'
    } ${formatNumber(this.type, l)}, ${formatNumber(this.type, r)}`
  }
  // `${result} = ${
  //   this.type === 'INTEGER' ? 'sub i32' : 'fsub double'
  // } ${this.type === 'INTEGER' ? l : l.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}, ${r}`
  constructor(type: ExprTypes) {
    this.type = type
  }
}
export class DIV implements Instruction {
  type: ExprTypes
  code: ThreeAddressCode = (result, l, r) =>
    `${result} = ${
      this.type === 'INTEGER' ? 'sdiv i32' : 'fdiv double'
    } ${formatNumber(this.type, l)}, ${formatNumber(this.type, r)}`
  constructor(type: ExprTypes) {
    this.type = type
  }
}

export class LT implements Instruction {
  type: ExprTypes
  code: ThreeAddressCode = (result, l, r) =>
    `${result} = ${
      this.type === 'INTEGER' ? 'icmp slt i32' : 'fcmp olt double'
    } ${formatNumber(this.type, l)}, ${formatNumber(this.type, r)}`
  // `${result} = icmp slt i32 ${l}, ${r}`
  constructor(type: ExprTypes) {
    this.type = type
  }
}
export class EQ implements Instruction {
  type: ExprTypes
  code: ThreeAddressCode = (result, l, r) =>
    `${result} = ${
      this.type === 'INTEGER' ? 'icmp eq i32' : 'fcmp oeq double'
    } ${l}, ${r}`
  constructor(type: ExprTypes) {
    this.type = type
  }
}
export class LE implements Instruction {
  type: ExprTypes
  code: ThreeAddressCode = (result, l, r) =>
    `${result} = ${
      this.type === 'INTEGER' ? 'icmp sle i32' : 'fcmp ole double'
    } ${formatNumber(this.type, l)}, ${formatNumber(this.type, r)}`
  constructor(type: ExprTypes) {
    this.type = type
  }
}
export class GT implements Instruction {
  type: ExprTypes
  code: ThreeAddressCode = (result, l, r) =>
    `${result} = ${
      this.type === 'INTEGER' ? 'icmp sgt i32' : 'fcmp ogt double'
    } ${formatNumber(this.type, l)}, ${formatNumber(this.type, r)}`
  constructor(type: ExprTypes) {
    this.type = type
  }
}
export class GE implements Instruction {
  type: ExprTypes
  code: ThreeAddressCode = (result, l, r) =>
    `${result} = ${
      this.type === 'INTEGER' ? 'icmp sge i32' : 'fcmp oge double'
    } ${formatNumber(this.type, l)}, ${formatNumber(this.type, r)}`
  constructor(type: ExprTypes) {
    this.type = type
  }
}
export class NE implements Instruction {
  type: ExprTypes
  code: ThreeAddressCode = (result, l, r) =>
    `${result} = ${
      this.type === 'INTEGER' ? 'icmp ne i32' : 'fcmp one double'
    } ${formatNumber(this.type, l)}, ${formatNumber(this.type, r)}`
  constructor(type: ExprTypes) {
    this.type = type
  }
}

export class CALL implements Instruction {
  name: string
  n: number
  type: ExprTypes = 'INTEGER'
  constructor(name: string, n: number, type: ExprTypes = 'INTEGER') {
    this.name = name
    this.n = n
    this.type = type
  }
}

export class LOAD_LOCAL implements Instruction {
  value: string
  type: ExprTypes
  constructor(name: string, type: ExprTypes) {
    this.value = name
    this.type = type
  }
  code = (r: REGISTER) => {
    const type = typeToLLVM(this.type)
    return `${r} = load ${type}, ${type}* %${this.value}`
  }
}
export class LOAD_GLOBAL implements Instruction {
  value: string
  type: ExprTypes
  constructor(name: string, type: ExprTypes) {
    this.value = name
    this.type = type
  }
  code = (r: REGISTER) => {
    const type = typeToLLVM(this.type)
    return `${r} = load ${type}, ${type}* @${this.value}`
  }
}

/**
 * NOTE: you should **NOT** use a string to construct a GOTO or CBRANCH (or BLOCK really),
 * but allowing it makes it easier to write tests, since Vitest.toEqual() doesn't actually
 * care if the Objects are technically the "same" or not.
 */

export class GOTO implements TypelessInstruction {
  label: LABEL
  // type: ExprTypes = 'INTEGER'
  constructor(label: string | LABEL) {
    this.label = typeof label === 'string' ? new LABEL(label) : label // label
  }
}

export class CBRANCH implements TypelessInstruction {
  left: LABEL
  right: LABEL
  // type: ExprTypes
  constructor(left: string | LABEL, right: string | LABEL) {
    this.left = typeof left === 'string' ? new LABEL(left) : left
    this.right = typeof right === 'string' ? new LABEL(right) : right
    // this.type = type
  }
}

export class EXPR implements Expression {
  instructions: Instruction[]
  type: ExprTypes // | null = null
  constructor(inst: Instruction[]) {
    this.instructions = inst
    this.type = inst[inst.length - 1].type
  }
}

function instructionFromCondOp(op: ConditionCodes, type: ExprTypes) {
  switch (op) {
    case '<':
      return new LT(type)
    case '==':
      return new EQ(type)
    case '<=':
      return new LE(type)
    case '>':
      return new GT(type)
    case '>=':
      return new GE(type)
    case '!=':
      return new NE(type)
  }
}
export class cEXPR extends EXPR implements Condition {
  left: EXPR
  right: EXPR
  op: ConditionCodes
  override type: ExprTypes
  // override type = null
  constructor(op: ConditionCodes, left: EXPR, right: EXPR, type: ExprTypes) {
    super(
      [
        ...left.instructions,
        ...right.instructions,
        instructionFromCondOp(op, type), //new (op === '<' ? LT : EQ)(),
      ]
      // type
    )
    this.op = op
    this.left = left
    this.right = right
    this.type = type
  }
}

function instructionFromBinOp(op: BinOpCodes, type: ExprTypes) {
  switch (op) {
    case '+':
      return new ADD(type)
    case '*':
      return new MUL(type)
    case '-':
      return new SUB(type)
    case '/':
      return new DIV(type)
  }
  // if (op === '+') return new ADD()
  // if (op === '*') return new MUL()
  // if (op === '-') return new SUB()
  // if (op === '/') return new DIV()
  // else throw new Error(`Misunderstood binOpCode: '${op}'`)
}
export class bEXPR extends EXPR implements BinaryOperator {
  left: EXPR
  right: EXPR
  op: BinOpCodes
  override type: ExprTypes
  constructor(op: BinOpCodes, left: EXPR, right: EXPR, type: ExprTypes) {
    super([
      ...left.instructions,
      ...right.instructions,
      instructionFromBinOp(op, type),
    ])
    this.op = op
    this.left = left
    this.right = right
    this.type = type
  }
}

export class STORE_LOCAL implements Instruction {
  value: string
  type: ExprTypes
  constructor(name: string, type: ExprTypes) {
    this.value = name
    this.type = type
  }
  code = (v?: REGISTER | number) => {
    const type = typeToLLVM(this.type) //this.type === 'INTEGER' ? 'i32' : 'double'
    return `store ${type} ${v}, ${type}* %${this.value}`
  }
}

export class STORE_GLOBAL implements Instruction {
  value: string
  type: ExprTypes
  constructor(name: string, type: ExprTypes) {
    this.value = name
    this.type = type
  }
  code = (v?: REGISTER | number) => {
    const type = typeToLLVM(this.type) //this.type === 'INTEGER' ? 'i32' : 'double'
    return `store ${type} ${v}, ${type}* @${this.value}`
  }
}

export class PRINT implements Instruction {
  type: ExprTypes
  constructor(type: ExprTypes) {
    this.type = type
  }
  code = (v?: REGISTER | number) =>
    this.type === 'INTEGER'
      ? `call i32 (i32) @_print_int(i32 ${v})`
      : `call i32 (double) @_print_float(double ${v})`
}
export class RETURN implements Instruction {
  type: ExprTypes
  constructor(type: ExprTypes) {
    this.type = type
  }
  code = (v?: REGISTER | number) => `ret ${typeToLLVM(this.type)} ${v}`
}

export class LOCAL implements Instruction {
  value: string
  type: ExprTypes
  constructor(name: string, type: ExprTypes) {
    this.value = name
    this.type = type
  }
  code = () => `%${this.value} => alloca ${typeToLLVM(this.type)}`
}

export class STATEMENT implements Statement {
  instructions: Instruction[]
  constructor(inst: Instruction[]) {
    this.instructions = inst
  }
}

export class BLOCK implements Statement {
  label: LABEL
  instructions: TypelessInstruction[]
  constructor(label: string | LABEL, inst: TypelessInstruction[]) {
    this.label = typeof label === 'string' ? new LABEL(label) : label
    this.instructions = inst
  }
}

export class LLVM_BLOCK implements BLOCK {
  label: LABEL
  instructions: string[]
  constructor(label: string | LABEL, inst: string[]) {
    this.label = typeof label === 'string' ? new LABEL(label) : label
    this.instructions = inst
  }
}

// Used as reference to BLOCK
export class LABEL {
  value: string
  constructor(name: string) {
    this.value = name
  }
  toString() {
    return this.value
  }
}

// export class LLVM implements Instruction {
//   instruction: string
//   constructor(instruction: string) {
//     this.instruction = instruction
//   }
// }

// Used as stack items
export class REGISTER {
  value: string
  constructor(name: string) {
    this.value = name
  }
  toString() {
    return this.value
  }
}
