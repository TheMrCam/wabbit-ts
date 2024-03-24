export * from './abstract'
export * from './binop'
export * from './condition'
export * from './expression'
export * from './statement'

import { Statement } from './abstract'

// export class Program {
//   statements: Statement[]
//   constructor(statements: Statement[]) {
//     this.statements = statements
//   }
// }

// <T> describes the possible types of top-level statements
// allows better TypeScript checking, and less headache
export class Program<T extends Statement = Statement> {
  statements: T[]
  constructor(statements: T[]) {
    this.statements = statements
  }
}
