import {
  Add,
  Assign,
  Call,
  Expression,
  Func,
  IfElse,
  Integer,
  LessThan,
  Multiply,
  Name,
  Print,
  Program,
  Return,
  VarDecl,
  VarInit,
  While,
} from '../ast'
import { Fold } from './fold'
import { Deinit } from './deinit'

describe('wab2 - the simplifier', { concurrent: true }, () => {
  test('part 1: constant folding', () => {
    const x = new Name('x', 'INTEGER')
    const variable = new VarInit(x, new Integer(10))
    const assign = new Assign(x, new Add(x, new Integer(1)))
    const print = (e: Expression) => new Print(new Add(e, x))
    const program = new Program([
      variable,
      assign,
      print(new Multiply(new Integer(23), new Integer(45))),
    ])
    expect(Fold.program(program)).toEqual(
      new Program([variable, assign, print(new Integer(1035))])
    )
  })
  test('part 2: de-initialization', () => {
    const y = new Name('y', 'INTEGER')
    const x = new Name('x', 'INTEGER')
    const ten = new Integer(10)
    const program = new Program([new VarInit(y, new Add(x, ten))])
    expect(Deinit.program(program)).toEqual(
      new Program([new VarDecl(y), new Assign(y, new Add(x, ten))])
    )
  })
  // test.todo('part 3: formatting')
  // test.todo('part 4: setting up compiler passes')
})
