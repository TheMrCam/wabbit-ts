import {
  Func,
  GlobalName,
  GlobalVar,
  IfElse,
  LocalName,
  Program,
  While,
} from '../ast'
import { Deinit } from '../compile/deinit'
import { Fold } from '../compile/fold'
import { Resolve } from '../compile/resolve'
import { Returns } from '../compile/returns'
import { Unscript } from '../compile/unscript'
import { Expressions } from './exprcode'
import { Statements } from './stmtcode'
import { parseFile } from '../parse'
import { Format } from '../format'
import {
  ADD,
  CALL,
  EXPR,
  LOAD_GLOBAL,
  LOAD_LOCAL,
  MUL,
  PRINT,
  PUSH,
  RETURN,
  STATEMENT,
  STORE_GLOBAL,
  STORE_LOCAL,
  cEXPR,
} from './instruction'

export function compile(program: Program): Program {
  return Statements.program(
    Expressions.program(
      Returns.program(
        Unscript.program(Resolve.program(Deinit.program(Fold.program(program))))
      )
    )
  )
}
// function compile(program: Program): Program {}

describe('program1.wb', { concurrent: true }, () => {
  const program = parseFile('wab/tests/program1.wb')
  // console.log(Format.program(compile(source)))
  const compiled = compile(program)
  test('compile expected', () => {
    expect(JSON.stringify(compiled)).toEqual(
      JSON.stringify(
        new Program([
          new GlobalVar(new GlobalName('x', 'INTEGER')),
          new Func(
            new GlobalName('main', 'INTEGER'),
            [],
            [
              new STATEMENT([new PUSH(10), new STORE_GLOBAL('x', 'INTEGER')]),
              new STATEMENT([
                new LOAD_GLOBAL('x', 'INTEGER'),
                new PUSH(1),
                new ADD('INTEGER'),
                new STORE_GLOBAL('x', 'INTEGER'),
              ]),
              new STATEMENT([
                new PUSH(1035),
                new LOAD_GLOBAL('x', 'INTEGER'),
                new ADD('INTEGER'),
                new PRINT('INTEGER'),
              ]),
              new STATEMENT([new PUSH(0), new RETURN('INTEGER')]),
            ]
          ),
        ])
      )
    )
  })
  test('format expected', () => {
    expect(Format.program(compiled)).toEqual(`global x int;
func main() int {
    STATEMENT([
        PUSH(10),
        STORE_GLOBAL(x)
    ])
    STATEMENT([
        LOAD_GLOBAL(x),
        PUSH(1),
        ADD(),
        STORE_GLOBAL(x)
    ])
    STATEMENT([
        PUSH(1035),
        LOAD_GLOBAL(x),
        ADD(),
        PRINT()
    ])
    STATEMENT([
        PUSH(0),
        RETURN()
    ])
}
`)
  })
})

describe('program2.wb', { concurrent: true }, () => {
  const program = parseFile('wab/tests/program2.wb')

  const compiled = compile(program)
  test('compile expected', () => {
    expect(JSON.stringify(compiled)).toEqual(
      JSON.stringify(
        new Program([
          new GlobalVar(new GlobalName('x', 'INTEGER')),
          new GlobalVar(new GlobalName('y', 'INTEGER')),
          new GlobalVar(new GlobalName('min', 'INTEGER')),
          new Func(new GlobalName('main', 'INTEGER'), undefined, [
            new STATEMENT([new PUSH(3), new STORE_GLOBAL('x', 'INTEGER')]),
            new STATEMENT([new PUSH(4), new STORE_GLOBAL('y', 'INTEGER')]),
            new STATEMENT([new PUSH(0), new STORE_GLOBAL('min', 'INTEGER')]),
            new IfElse(
              new cEXPR(
                '<',
                new EXPR([new LOAD_GLOBAL('x', 'INTEGER')]),
                new EXPR([new LOAD_GLOBAL('y', 'INTEGER')]),
                'INTEGER'
              ),
              [
                new STATEMENT([
                  new LOAD_GLOBAL('x', 'INTEGER'),
                  new STORE_GLOBAL('min', 'INTEGER'),
                ]),
              ],
              [
                new STATEMENT([
                  new LOAD_GLOBAL('y', 'INTEGER'),
                  new STORE_GLOBAL('min', 'INTEGER'),
                ]),
              ]
            ),
            new STATEMENT([
              new LOAD_GLOBAL('min', 'INTEGER'),
              new PRINT('INTEGER'),
            ]),
            new STATEMENT([new PUSH(0), new RETURN('INTEGER')]),
          ]),
        ])
      )
    )
  })
  test('format expected', () => {
    expect(Format.program(compiled)).toEqual(`global x int;
global y int;
global min int;
func main() int {
    STATEMENT([
        PUSH(3),
        STORE_GLOBAL(x)
    ])
    STATEMENT([
        PUSH(4),
        STORE_GLOBAL(y)
    ])
    STATEMENT([
        PUSH(0),
        STORE_GLOBAL(min)
    ])
    if EXPR([LOAD_GLOBAL(x)]) < EXPR([LOAD_GLOBAL(y)]) {
        STATEMENT([
            LOAD_GLOBAL(x),
            STORE_GLOBAL(min)
        ])
    } else {
        STATEMENT([
            LOAD_GLOBAL(y),
            STORE_GLOBAL(min)
        ])
    }
    STATEMENT([
        LOAD_GLOBAL(min),
        PRINT()
    ])
    STATEMENT([
        PUSH(0),
        RETURN()
    ])
}
`)
  })
})

describe('program3.wb', { concurrent: true }, () => {
  const program = parseFile('wab/tests/program3.wb')

  const compiled = compile(program)
  test('compile expected', () => {
    expect(JSON.stringify(compiled)).toEqual(
      JSON.stringify(
        new Program([
          new GlobalVar(new GlobalName('result', 'INTEGER')),
          new GlobalVar(new GlobalName('x', 'INTEGER')),
          new Func(
            new GlobalName('main', 'INTEGER'),
            [],
            [
              new STATEMENT([
                new PUSH(1),
                new STORE_GLOBAL('result', 'INTEGER'),
              ]),
              new STATEMENT([new PUSH(1), new STORE_GLOBAL('x', 'INTEGER')]),
              new While(
                new cEXPR(
                  '<',
                  new EXPR([new LOAD_GLOBAL('x', 'INTEGER')]),
                  new EXPR([new PUSH(10)]),
                  'INTEGER'
                ),
                [
                  new STATEMENT([
                    new LOAD_GLOBAL('result', 'INTEGER'),
                    new LOAD_GLOBAL('x', 'INTEGER'),
                    new MUL('INTEGER'),
                    new STORE_GLOBAL('result', 'INTEGER'),
                  ]),
                  new STATEMENT([
                    new LOAD_GLOBAL('x', 'INTEGER'),
                    new PUSH(1),
                    new ADD('INTEGER'),
                    new STORE_GLOBAL('x', 'INTEGER'),
                  ]),
                ]
              ),
              new STATEMENT([
                new LOAD_GLOBAL('result', 'INTEGER'),
                new PRINT('INTEGER'),
              ]),
              new STATEMENT([new PUSH(0), new RETURN('INTEGER')]),
            ]
          ),
        ])
      )
    )
  })
  test('format expected', () => {
    expect(Format.program(compiled)).toEqual(`global result int;
global x int;
func main() int {
    STATEMENT([
        PUSH(1),
        STORE_GLOBAL(result)
    ])
    STATEMENT([
        PUSH(1),
        STORE_GLOBAL(x)
    ])
    while EXPR([LOAD_GLOBAL(x)]) < EXPR([PUSH(10)]) {
        STATEMENT([
            LOAD_GLOBAL(result),
            LOAD_GLOBAL(x),
            MUL(),
            STORE_GLOBAL(result)
        ])
        STATEMENT([
            LOAD_GLOBAL(x),
            PUSH(1),
            ADD(),
            STORE_GLOBAL(x)
        ])
    }
    STATEMENT([
        LOAD_GLOBAL(result),
        PRINT()
    ])
    STATEMENT([
        PUSH(0),
        RETURN()
    ])
}
`)
  })
})

describe('program4.wb', { concurrent: true }, () => {
  const program = parseFile('wab/tests/program4.wb')

  const compiled = compile(program)
  test('compile expected', () => {
    expect(JSON.stringify(compiled)).toEqual(
      JSON.stringify(
        new Program([
          new Func(
            new GlobalName('add1', 'INTEGER'),
            [new LocalName('x', 'INTEGER')],
            [
              new STATEMENT([
                new LOAD_LOCAL('x', 'INTEGER'),
                new PUSH(1),
                new ADD('INTEGER'),
                new STORE_LOCAL('x', 'INTEGER'),
              ]),
              new STATEMENT([
                new LOAD_LOCAL('x', 'INTEGER'),
                new RETURN('INTEGER'),
              ]),
            ]
          ),
          new GlobalVar(new GlobalName('x', 'INTEGER')),
          new Func(
            new GlobalName('main', 'INTEGER'),
            [],
            [
              new STATEMENT([new PUSH(10), new STORE_GLOBAL('x', 'INTEGER')]),
              new STATEMENT([
                new PUSH(1035),
                new LOAD_GLOBAL('x', 'INTEGER'),
                new CALL('add1', 1),
                new ADD('INTEGER'),
                new PRINT('INTEGER'),
              ]),
              new STATEMENT([
                new LOAD_GLOBAL('x', 'INTEGER'),
                new PRINT('INTEGER'),
              ]),
              new STATEMENT([new PUSH(0), new RETURN('INTEGER')]),
            ]
          ),
        ])
      )
    )
  })
  test('format expected', () => {
    expect(Format.program(compiled)).toEqual(`func add1(x int) int {
    STATEMENT([
        LOAD_LOCAL(x),
        PUSH(1),
        ADD(),
        STORE_LOCAL(x)
    ])
    STATEMENT([
        LOAD_LOCAL(x),
        RETURN()
    ])
}

global x int;
func main() int {
    STATEMENT([
        PUSH(10),
        STORE_GLOBAL(x)
    ])
    STATEMENT([
        PUSH(1035),
        LOAD_GLOBAL(x),
        add1(),
        ADD(),
        PRINT()
    ])
    STATEMENT([
        LOAD_GLOBAL(x),
        PRINT()
    ])
    STATEMENT([
        PUSH(0),
        RETURN()
    ])
}
`)
  })
})

// describe('statementInstructions', () => {
//   test('print 42', { todo: true })
// })
