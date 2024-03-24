export abstract class Statement {}
// export abstract class TypelessExpression {}
export abstract class Expression {
  abstract type: ExprTypes //| null
}

export type ExprTypes = 'INTEGER' | 'FLOAT'

export function optionalToArray<T>(o?: T | T[]): T[] {
  if (!o) return []
  if (Array.isArray(o)) return o
  return [o]
}
