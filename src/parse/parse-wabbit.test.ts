import { tokenize } from './tokenize'
import {
  parseArguments,
  parseBinaryExpression,
  parseCondition,
  parseExpression,
  parseProgram,
  parseStatement,
} from './parse-wabbit'
import {
  Add,
  Assign,
  Call,
  Condition,
  Equals,
  Float,
  Func,
  IfElse,
  Integer,
  LessThan,
  LessThanEquals,
  Multiply,
  Name,
  Print,
  Program,
  Return,
  VarDecl,
  VarInit,
  While,
} from '../ast'

describe('parse simple programs', { concurrent: true }, () => {
  test('define and call func', () => {
    const source = `func f(x int,y int) int {
    return x * y;
}

print f(2,2);
`
    expect(parseProgram(tokenize(source))).toEqual(
      new Program([
        new Func(
          new Name('f', 'INTEGER'),
          [new Name('x', 'INTEGER'), new Name('y', 'INTEGER')],
          new Return(
            new Multiply(new Name('x', 'INTEGER'), new Name('y', 'INTEGER'))
          )
        ),
        new Print(
          new Call(new Name('f', 'INTEGER'), [new Integer(2), new Integer(2)])
        ),
      ])
    )
  })

  // TODO: figure out the issue with recursive programs, and fix it
  test('recursive func', () => {
    const source = `func countToTen(n int) int {
    if n < 10 {
      print n;
      return countToTen(n + 1);
    } else {
      return 0;
    }
}

print countToTen(0);    
`

    expect(parseProgram(tokenize(source))).toEqual(
      new Program([
        new Func(
          new Name('countToTen', 'INTEGER'),
          [new Name('n', 'INTEGER')],
          [
            new IfElse(
              new LessThan(new Name('n', 'INTEGER'), new Integer(10)),
              [
                new Print(new Name('n', 'INTEGER')),
                new Return(
                  new Call(new Name('countToTen', 'INTEGER'), [
                    new Add(new Name('n', 'INTEGER'), new Integer(1)),
                  ])
                ),
              ],
              [new Return(new Integer(0))]
            ),
          ]
        ),
        new Print(new Call(new Name('countToTen', 'INTEGER'), new Integer(0))),
      ])
    )
  })
})

describe('parse simple statements', { concurrent: true }, () => {
  test('print', () => {
    const statement = tokenize('print 42;')
    expect(parseStatement(statement, new Map())).toEqual(
      new Print(new Integer(42))
    )
  })
  test('return', () => {
    const statement = tokenize('return 42;')
    expect(parseStatement(statement, new Map())).toEqual(
      new Return(new Integer(42))
    )
  })
  test('assign', () => {
    const statement = tokenize('x = 42;')

    const typeCache = new Map()
    expect(parseStatement(statement, typeCache)).toEqual(
      new Assign(new Name('x', 'INTEGER'), new Integer(42))
    )
    expect(typeCache.get('x')).toEqual('INTEGER')
  })
  test('var', () => {
    const statement = tokenize('var x int;')

    const typeCache = new Map()
    expect(parseStatement(statement, typeCache)).toEqual(
      new VarDecl(new Name('x', 'INTEGER'))
    )
    expect(typeCache.get('x')).toEqual('INTEGER')
  })
  test('var init', () => {
    const statement = tokenize('var x = 42;')

    const typeCache = new Map()
    expect(parseStatement(statement, typeCache)).toEqual(
      new VarInit(new Name('x', 'INTEGER'), new Integer(42))
    )
    expect(typeCache.get('x')).toEqual('INTEGER')
  })
  // TODO: fix everything below this line these
  test.todo('while', () => {
    const statement = tokenize('while x < y { }')
    expect(parseStatement(statement)).toEqual(
      new While(new LessThan(new Name('x'), new Name('y')))
    )
  })
  test.todo('if else', () => {
    const statement = tokenize('if x < y { } else { }')

    expect(parseStatement(statement)).toEqual(
      new IfElse(new LessThan(new Name('x'), new Name('y')))
    )
    expect(
      parseStatement(tokenize('if a < 2 { print 1; } else { print a; }'))
    ).toEqual(
      new IfElse(
        new LessThan(new Name('a'), new Integer(2)),
        [new Print(new Integer(1))],
        [new Print(new Name('a'))]
      )
    )
  })
  test.todo('func', () => {
    expect(parseStatement(tokenize('func f() int {}'))).toEqual(
      new Func(new Name('f'), undefined, [])
    )
    expect(parseStatement(tokenize('func f(a int) int {}'))).toEqual(
      new Func(new Name('f'), new Name('a'), [])
    )
    expect(parseStatement(tokenize('func f(a int, b int) int { }'))).toEqual(
      new Func(new Name('f'), [new Name('a'), new Name('b')], [])
    )
    expect(
      parseStatement(tokenize('func f(a int,b int,c int) int { print 42;}'))
    ).toEqual(
      new Func(
        new Name('f'),
        [new Name('a'), new Name('b'), new Name('c')],
        [new Print(new Integer(42))]
      )
    )
  })
})

describe('parse simple expressions', { concurrent: true, todo: true }, () => {
  test('integer', () => {
    expect(parseExpression(tokenize('42'))).toEqual(new Integer(42))
    expect(parseExpression(tokenize('70'))).toEqual(new Integer(70))
  })

  test('condition', () => {
    expect(parseCondition(tokenize('x < y'))).toEqual(
      new LessThan(new Name('x'), new Name('y'))
    )
    expect(parseCondition(tokenize('x == y'))).toEqual(
      new Equals(new Name('x'), new Name('y'))
    )
  })

  describe('binary operator', () => {
    test('add integers', () => {
      expect(parseBinaryExpression(tokenize('1 + 1'))).toEqual(
        new Add(new Integer(1), new Integer(1))
      )
    })
    test('multiply names', () => {
      expect(parseBinaryExpression(tokenize('x * y'))).toEqual(
        new Multiply(new Name('x'), new Name('y'))
      )
    })
    test('integer then group', () => {
      expect(parseExpression(tokenize('1 + (2 * 3)'))).toEqual(
        new Add(new Integer(1), new Multiply(new Integer(2), new Integer(3)))
      )
    })
    test('group then integer', () => {
      expect(parseExpression(tokenize('(1 + 2) * 3'))).toEqual(
        new Multiply(new Add(new Integer(1), new Integer(2)), new Integer(3))
      )
    })
    test('groups with names', () => {
      expect(parseExpression(tokenize('a * (b * c)'))).toEqual(
        new Multiply(new Name('a'), new Multiply(new Name('b'), new Name('c')))
      )
      expect(parseExpression(tokenize('(x + y) + z'))).toEqual(
        new Add(new Add(new Name('x'), new Name('y')), new Name('z'))
      )
    })
  })

  test('call', () => {
    expect(parseExpression(tokenize('f()'))).toEqual(new Call(new Name('f')))
    expect(parseExpression(tokenize('a(b,c)'))).toEqual(
      new Call(new Name('a'), [new Name('b'), new Name('c')])
    )
  })
})

describe('micro unit tests', { concurrent: true, todo: true }, () => {
  test('parseArguments', () => {
    expect(parseArguments(tokenize('a,b,c)'))).toEqual([
      new Name('a'),
      new Name('b'),
      new Name('c'),
    ])
    expect(parseArguments(tokenize(')'))).toEqual([])
  })
  test('parseParameters', { todo: true }, () => {})
})

describe('floats', { concurrent: true }, () => {
  test('var', () => {
    expect(parseStatement(tokenize('var x float;'), new Map())).toEqual(
      new VarDecl(new Name('x', 'FLOAT'))
    )
    expect(parseStatement(tokenize('var x = 1.0;'), new Map())).toEqual(
      new VarInit(new Name('x', 'FLOAT'), new Float(1.0))
    )
  })
  test('add', () => {
    expect(parseBinaryExpression(tokenize('1.0 + 2.5'), new Map())).toEqual(
      new Add(new Float(1.0), new Float(2.5))
    )
  })
  test('print', () => {
    expect(parseStatement(tokenize('print 4.2;'), new Map())).toEqual(
      new Print(new Float(4.2))
    )
  })
  test('condition', () => {
    expect(parseExpression(tokenize('3.1 <= 5.4'))).toEqual(
      new LessThanEquals(new Float(3.1), new Float(5.4))
    )
  })
})
