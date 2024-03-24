import { ExprTypes, Expression } from './abstract'

export type BinOpCodes = '+' | '*' | '-' | '/'
export class BinaryOperator implements Expression {
  type: ExprTypes
  left: Expression
  right: Expression
  readonly op: BinOpCodes
  constructor(
    op: BinOpCodes,
    left: Expression,
    right: Expression
    // type: ExprTypes
  ) {
    if (left.type === null || right.type === null || left.type !== right.type) {
      throw new Error(
        `Invalid binary operator typing: ${left.type} !== ${right.type}`
      )
    }
    this.op = op
    this.left = left
    this.right = right
    this.type = left.type
  }
  static fromOp(
    op: BinOpCodes,
    left: Expression,
    right: Expression
    // type: ExprTypes
  ) {
    if (left.type === null || right.type === null || left.type !== right.type) {
      throw new Error(
        `Invalid binary operator typing: ${left.type} !== ${right.type}`
      )
    }
    // const type = left.type
    switch (op) {
      case '+':
        return new Add(left, right)
      case '*':
        return new Multiply(left, right)
      case '-':
        return new Subtract(left, right)
      case '/':
        return new Divide(left, right)
    }
    // if (op === '+') return new Add(left, right)
    // else if (op === '*') return new Multiply(left, right)
    // else if (op === '-') return new Subtract(left, right)
    // else if (op === '/') return new Divide(left, right)
    // else return new BinaryOperator(op, left, right)
  }
}

/**
 * ```
 * left + right
 * ```
 */
export class Add extends BinaryOperator {
  constructor(
    left: Expression,
    right: Expression
    // type: ExprTypes
  ) {
    super('+', left, right)
  }
}

/**
 * ```
 * left * right
 * ```
 */
export class Multiply extends BinaryOperator {
  constructor(
    left: Expression,
    right: Expression
    // type: ExprTypes
  ) {
    super('*', left, right)
  }
}

/**
 * ```
 * left - right
 * ```
 */
export class Subtract extends BinaryOperator {
  constructor(
    left: Expression,
    right: Expression
    // type: ExprTypes
  ) {
    super('-', left, right)
  }
}

/**
 * ```
 * left / right
 * ```
 */
export class Divide extends BinaryOperator {
  constructor(
    left: Expression,
    right: Expression
    // type: ExprTypes
  ) {
    super('/', left, right)
  }
}
