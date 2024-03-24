import { ExprTypes, Expression, optionalToArray } from './abstract'
import { Func } from './statement'

/**
 * Represents a reference to a previously declared variable
 */
export class Name implements Expression {
  value: string
  type: ExprTypes
  constructor(name: string, type: ExprTypes) {
    this.value = name
    this.type = type
  }
}

export class GlobalName extends Name {
  constructor(name: string, type: ExprTypes) {
    super(name, type)
  }
}

export class LocalName extends Name {
  constructor(name: string, type: ExprTypes) {
    super(name, type)
  }
}

/**
 * Represents an integer
 */
export class Integer implements Expression {
  type: ExprTypes = 'INTEGER'
  value: number
  constructor(value: number) {
    this.value = Math.floor(value)
  }
}

export class Float implements Expression {
  type: ExprTypes = 'FLOAT'
  value: number
  constructor(value: number) {
    this.value = value
  }
}

/**
 * Represents a call to a function
 *
 * ```
 * function(...arguments)
 * ```
 */
export class Call implements Expression {
  function: Name
  arguments: Expression[]
  type: ExprTypes
  constructor(func: Name, args?: Expression | Expression[]) {
    this.function = func
    this.arguments = optionalToArray(args)
    this.type = func.type
  }
}

export class Negate implements Expression {
  expression: Expression
  type: ExprTypes
  constructor(exp: Expression, type: ExprTypes) {
    this.expression = exp
    this.type = type
  }
}
