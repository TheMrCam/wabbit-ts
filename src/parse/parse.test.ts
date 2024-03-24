import { tokenize } from './tokenize'
import {
  parseArguments,
  parseBinaryExpression,
  parseCondition,
  parseExpression,
  parseProgram,
  parseStatement,
} from './parse'
import {
  Add,
  Assign,
  Call,
  Condition,
  Equals,
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

describe('parse simple programs', { concurrent: true }, () => {
  test('define and call func', () => {
    const source = `func f(x,y) {
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
    const source = `func countToTen(n) {
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
    expect(parseStatement(statement)).toEqual(new Print(new Integer(42)))
  })
  test('return', () => {
    const statement = tokenize('return 42;')
    expect(parseStatement(statement)).toEqual(new Return(new Integer(42)))
  })
  test('assign', () => {
    const statement = tokenize('x = 42;')
    expect(parseStatement(statement)).toEqual(
      new Assign(new Name('x', 'INTEGER'), new Integer(42))
    )
  })
  test('var', () => {
    const statement = tokenize('var x;')
    expect(parseStatement(statement)).toEqual(
      new VarDecl(new Name('x', 'INTEGER'))
    )
  })
  test('var init', () => {
    const statement = tokenize('var x = 42;')
    expect(parseStatement(statement)).toEqual(
      new VarInit(new Name('x', 'INTEGER'), new Integer(42))
    )
  })
  test('while', () => {
    const statement = tokenize('while x < y { }')
    expect(parseStatement(statement)).toEqual(
      new While(
        new LessThan(new Name('x', 'INTEGER'), new Name('y', 'INTEGER'))
      )
    )
  })
  test('if else', () => {
    const statement = tokenize('if x < y { } else { }')

    expect(parseStatement(statement)).toEqual(
      new IfElse(
        new LessThan(new Name('x', 'INTEGER'), new Name('y', 'INTEGER'))
      )
    )
    expect(
      parseStatement(tokenize('if a < 2 { print 1; } else { print a; }'))
    ).toEqual(
      new IfElse(
        new LessThan(new Name('a', 'INTEGER'), new Integer(2)),
        [new Print(new Integer(1))],
        [new Print(new Name('a', 'INTEGER'))]
      )
    )
  })
  test('func', () => {
    expect(parseStatement(tokenize('func f() {}'))).toEqual(
      new Func(new Name('f', 'INTEGER'), undefined, [])
    )
    expect(parseStatement(tokenize('func f(a) {}'))).toEqual(
      new Func(new Name('f', 'INTEGER'), new Name('a', 'INTEGER'), [])
    )
    expect(parseStatement(tokenize('func f(a, b) { }'))).toEqual(
      new Func(
        new Name('f', 'INTEGER'),
        [new Name('a', 'INTEGER'), new Name('b', 'INTEGER')],
        []
      )
    )
    expect(parseStatement(tokenize('func f(a,b,c) { print 42;}'))).toEqual(
      new Func(
        new Name('f', 'INTEGER'),
        [
          new Name('a', 'INTEGER'),
          new Name('b', 'INTEGER'),
          new Name('c', 'INTEGER'),
        ],
        [new Print(new Integer(42))]
      )
    )
  })
})

describe('parse simple expressions', { concurrent: true }, () => {
  test('integer', () => {
    expect(parseExpression(tokenize('42'))).toEqual(new Integer(42))
    expect(parseExpression(tokenize('70'))).toEqual(new Integer(70))
  })

  test('condition', () => {
    expect(parseCondition(tokenize('x < y'))).toEqual(
      new LessThan(new Name('x', 'INTEGER'), new Name('y', 'INTEGER'))
    )
    expect(parseCondition(tokenize('x == y'))).toEqual(
      new Equals(new Name('x', 'INTEGER'), new Name('y', 'INTEGER'))
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
        new Multiply(new Name('x', 'INTEGER'), new Name('y', 'INTEGER'))
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
        new Multiply(
          new Name('a', 'INTEGER'),
          new Multiply(new Name('b', 'INTEGER'), new Name('c', 'INTEGER'))
        )
      )
      expect(parseExpression(tokenize('(x + y) + z'))).toEqual(
        new Add(
          new Add(new Name('x', 'INTEGER'), new Name('y', 'INTEGER')),
          new Name('z', 'INTEGER')
        )
      )
    })
  })

  test('call', () => {
    expect(parseExpression(tokenize('f()'))).toEqual(
      new Call(new Name('f', 'INTEGER'))
    )
    expect(parseExpression(tokenize('a(b,c)'))).toEqual(
      new Call(new Name('a', 'INTEGER'), [
        new Name('b', 'INTEGER'),
        new Name('c', 'INTEGER'),
      ])
    )
  })
})

describe('micro unit tests', { concurrent: true }, () => {
  test('parseArguments', () => {
    expect(parseArguments(tokenize('a,b,c)'))).toEqual([
      new Name('a', 'INTEGER'),
      new Name('b', 'INTEGER'),
      new Name('c', 'INTEGER'),
    ])
    expect(parseArguments(tokenize(')'))).toEqual([])
  })
  test('parseParameters', { todo: true }, () => {})
})
