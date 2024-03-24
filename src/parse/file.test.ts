import { parseFile } from './file'
import { Format } from '../format'
import {
  Add,
  Assign,
  Call,
  Func,
  IfElse,
  Integer,
  LessThan,
  Multiply,
  Name,
  Print,
  Program,
  Return,
  VarInit,
  While,
} from '../ast'

describe('parseFile', { concurrent: true }, () => {
  // console.log(
  //   `[DEBUG]-test format parsed file\n`,
  //   Format.program(parseFile('wab/tests/fact.wb'))
  // )

  test('program1.wb', () => {
    expect(parseFile('wab/tests/program1.wb')).toEqual(
      new Program([
        new VarInit(new Name('x', 'INTEGER'), new Integer(10)),
        new Assign(
          new Name('x', 'INTEGER'),
          new Add(new Name('x', 'INTEGER'), new Integer(1))
        ),
        new Print(
          new Add(
            new Multiply(new Integer(23), new Integer(45)),
            new Name('x', 'INTEGER')
          )
        ),
      ])
    )
  })

  test('program2.wb', () => {
    const x = new Name('x', 'INTEGER')
    const y = new Name('y', 'INTEGER')
    const min = new Name('min', 'INTEGER')
    const encoded = new Program([
      new VarInit(x, new Integer(3)),
      new VarInit(y, new Integer(4)),
      new VarInit(min, new Integer(0)),
      new IfElse(new LessThan(x, y), new Assign(min, x), new Assign(min, y)),
      new Print(min),
    ])
    expect(parseFile('wab/tests/program2.wb')).toEqual(encoded)
  })

  test('program3.wb', () => {
    const result = new Name('result', 'INTEGER')
    const x = new Name('x', 'INTEGER')
    const one = new Integer(1)
    const encoded = new Program([
      new VarInit(result, one),
      new VarInit(x, one),
      new While(new LessThan(x, new Integer(10)), [
        new Assign(result, new Multiply(result, x)),
        new Assign(x, new Add(x, one)),
      ]),
      new Print(result),
    ])
    expect(parseFile('wab/tests/program3.wb')).toEqual(encoded)
  })

  test('program4.wb', () => {
    const x = new Name('x', 'INTEGER')
    const argX = new Name('x', 'INTEGER')
    const add1 = new Func(new Name('add1', 'INTEGER'), argX, [
      new Assign(argX, new Add(argX, new Integer(1))),
      new Return(argX),
    ])
    const encoded = new Program([
      add1,
      new VarInit(x, new Integer(10)),
      new Print(
        new Add(
          new Multiply(new Integer(23), new Integer(45)),
          new Call(add1.name, x)
        )
      ),
      new Print(x),
    ])
    expect(parseFile('wab/tests/program4.wb')).toEqual(encoded)
  })

  test('fact.wb', () => {
    expect(parseFile('wab/tests/fact.wb')).toEqual(
      new Program([
        new Func(new Name('fact', 'INTEGER'), new Name('n', 'INTEGER'), [
          new IfElse(
            new LessThan(new Name('n', 'INTEGER'), new Integer(2)),
            [new Return(new Integer(1))],
            [
              new VarInit(new Name('x', 'INTEGER'), new Integer(1)),
              new VarInit(new Name('result', 'INTEGER'), new Integer(1)),
              new While(
                new LessThan(
                  new Name('x', 'INTEGER'),
                  new Name('n', 'INTEGER')
                ),
                [
                  new Assign(
                    new Name('result', 'INTEGER'),
                    new Multiply(
                      new Name('result', 'INTEGER'),
                      new Name('x', 'INTEGER')
                    )
                  ),
                  new Assign(
                    new Name('x', 'INTEGER'),
                    new Add(new Name('x', 'INTEGER'), new Integer(1))
                  ),
                ]
              ),
              new Return(
                new Multiply(
                  new Name('result', 'INTEGER'),
                  new Name('n', 'INTEGER')
                )
              ),
            ]
          ),
        ]),
        new VarInit(new Name('x', 'INTEGER'), new Integer(1)),
        new While(new LessThan(new Name('x', 'INTEGER'), new Integer(10)), [
          new Print(
            new Call(new Name('fact', 'INTEGER'), [new Name('x', 'INTEGER')])
          ),
          new Assign(
            new Name('x', 'INTEGER'),
            new Add(new Name('x', 'INTEGER'), new Integer(1))
          ),
        ]),
      ])
    )
  })

  // TODO: fix recursive function parsing
  test('factre.wb', { todo: true }, () => {
    console.log(Format.program(parseFile('wab/tests/factre.wb')))
  })
})
