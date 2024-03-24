import { ExprTypes, Expression } from './abstract'

export type ConditionCodes = '<' | '==' | '<=' | '>' | '>=' | '!='
/**
 * Represents the generic form of fairly special type of Binary expression.
 * Would be abstract, but it's useful to copy one based on the `op` value.
 */
export class Condition implements Expression {
  type: ExprTypes
  left: Expression
  right: Expression
  readonly op: ConditionCodes
  constructor(
    op: ConditionCodes,
    left: Expression,
    right: Expression
    // type: ExprTypes = 'INTEGER'
  ) {
    this.op = op
    this.left = left
    this.right = right
    const type =
      left.type === 'FLOAT' || right.type === 'FLOAT' ? 'FLOAT' : 'INTEGER'
    this.type = type
  }
  static fromOp(
    op: ConditionCodes,
    left: Expression,
    right: Expression
    // type: ExprTypes = 'INTEGER'
  ) {
    switch (op) {
      case '<':
        return new LessThan(left, right)
      case '==':
        return new Equals(left, right)
      case '<=':
        return new LessThanEquals(left, right)
      case '>':
        return new GreaterThan(left, right)
      case '>=':
        return new GreaterThanEquals(left, right)
      case '!=':
        return new NotEquals(left, right)
    }
    // if (op === '<') return new LessThan(left, right)
    // else if (op === '==') return new Equals(left, right)
    // else return new Condition(op, left, right)
  }
}

/**
 * ```
 * left < right
 * ```
 */
export class LessThan extends Condition {
  constructor(
    left: Expression,
    right: Expression
    // type: ExprTypes = 'INTEGER'
  ) {
    super('<', left, right)
  }
}

/**
 * ```
 * left <= right
 * ```
 */
export class LessThanEquals extends Condition {
  constructor(
    left: Expression,
    right: Expression
    // type: ExprTypes = 'INTEGER'
  ) {
    super('<=', left, right)
  }
}

/**
 * ```
 * left > right
 * ```
 */
export class GreaterThan extends Condition {
  constructor(left: Expression, right: Expression) {
    super('>', left, right)
  }
}

/**
 * ```
 * left >= right
 * ```
 */
export class GreaterThanEquals extends Condition {
  constructor(left: Expression, right: Expression) {
    super('>=', left, right)
  }
}
/**
 * ```
 * left == right
 * ```
 */
export class Equals extends Condition {
  constructor(
    left: Expression,
    right: Expression
    // type: ExprTypes = 'INTEGER'
  ) {
    super('==', left, right)
  }
}

/**
 * ```
 * left != right
 * ```
 */
export class NotEquals extends Condition {
  constructor(
    left: Expression,
    right: Expression
    // type: ExprTypes = 'INTEGER'
  ) {
    super('!=', left, right)
  }
}
