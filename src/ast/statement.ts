import { ExprTypes, Expression, Statement, optionalToArray } from './abstract'
import { Condition } from './condition'
import { GlobalName, LocalName, Name } from './expression'

/**
 * `var name;`
 */
export class VarDecl implements Statement {
  name: Name
  constructor(name: Name) {
    this.name = name
  }
}

export class GlobalVar extends VarDecl {
  constructor(name: Name) {
    super(new GlobalName(name.value, name.type))
  }
}

export class LocalVar extends VarDecl {
  constructor(name: Name) {
    super(new LocalName(name.value, name.type))
  }
}
/**
 * `var name = value;`
 */
export class VarInit implements Statement {
  name: Name
  value: Expression
  constructor(name: Name, value: Expression) {
    this.name = name
    this.value = value
  }
}

/**
 * `name = value;`
 */
export class Assign implements Statement {
  name: Name
  value: Expression
  constructor(name: Name, value: Expression) {
    this.name = name
    this.value = value
  }
}

/**
 * `print value;`
 */
export class Print implements Statement {
  value: Expression
  constructor(value: Expression) {
    this.value = value
  }
}

/**
 * ```
 * if condition {
 *   ...ifTrue
 * } else {
 *   ...ifFalse
 * }
 * ```
 */
export class IfElse implements Statement {
  condition: Condition
  ifTrue: Statement[]
  ifFalse: Statement[]
  constructor(
    condition: Condition,
    ifTrue?: Statement | Statement[],
    ifFalse?: Statement | Statement[]
  ) {
    this.condition = condition
    this.ifTrue = optionalToArray(ifTrue)
    this.ifFalse = optionalToArray(ifFalse)
  }
}

/**
 * ```
 * while condition {
 *   ...statements
 * }
 * ```
 */
export class While implements Statement {
  condition: Condition
  statements: Statement[]
  constructor(whileTrue: Condition, statements?: Statement | Statement[]) {
    this.condition = whileTrue
    this.statements = optionalToArray(statements)
  }
}

// TODO: Make Func<T>, similar to Program<T>, to specify down to instruction level
/**
 * ```
 * func name(...parameters) {
 *   ...statements
 * }
 * ```
 */
export class Func implements Statement {
  name: Name
  parameters: Name[]
  statements: Statement[]
  returnType: ExprTypes
  constructor(
    name: Name,
    // type: ExprTypes,
    args?: Name | Name[],
    statements?: Statement | Statement[]
  ) {
    this.name = name
    this.parameters = optionalToArray(args)
    this.statements = optionalToArray(statements)
    this.returnType = name.type
  }
}

/**
 * ```
 * return value
 * ```
 */
export class Return implements Statement {
  value: Expression
  constructor(value: Expression) {
    this.value = value
  }
}

export class ExprStatement implements Statement {
  expression: Expression
  constructor(value: Expression) {
    this.expression = value
  }
}

export type AllStatements =
  | VarInit
  | VarDecl
  | GlobalVar
  | LocalVar
  | Assign
  | Print
  | IfElse
  | While
  | Func
  | Return
  | ExprStatement
