import {
  Add,
  Assign,
  Integer,
  Multiply,
  Name,
  Print,
  VarInit,
  GlobalName,
  GlobalVar,
  IfElse,
  LocalName,
  Program,
  Func,
  While,
} from '../ast'
import { Deinit } from '../compile/deinit'
import { Fold } from '../compile/fold'
import { Resolve } from '../compile/resolve'
import { Returns } from '../compile/returns'
import { Unscript } from '../compile/unscript'
import { Expressions } from './exprcode'
import { Statements } from './stmtcode'
import { Blocks } from './blocks'
// import * as Blocks from './blocks'
import { Format } from '../format'
import { parseFile } from '../parse'
import {
  ADD,
  BLOCK,
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
} from '.'

function compile(program: Program): Program {
  return Blocks.program(
    Statements.program(
      Expressions.program(
        Returns.program(
          Unscript.program(
            Resolve.program(Deinit.program(Fold.program(program)))
          )
        )
      )
    )
  )
}

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
              new BLOCK('L0', [
                new PUSH(10),
                new STORE_GLOBAL('x', 'INTEGER'),
                new LOAD_GLOBAL('x', 'INTEGER'),
                new PUSH(1),
                new ADD('INTEGER'),
                new STORE_GLOBAL('x', 'INTEGER'),
                new PUSH(1035),
                new LOAD_GLOBAL('x', 'INTEGER'),
                new ADD('INTEGER'),
                new PRINT('INTEGER'),
                new PUSH(0),
                new RETURN('INTEGER'),
              ]),
            ]
          ),
        ])
      )
    )
  })

  test('format expected', () => {
    expect(Format.program(compiled)).toEqual(`global x int;
func main() int {
    BLOCK('L0',[
        PUSH(10),
        STORE_GLOBAL(x),
        LOAD_GLOBAL(x),
        PUSH(1),
        ADD(),
        STORE_GLOBAL(x),
        PUSH(1035),
        LOAD_GLOBAL(x),
        ADD(),
        PRINT(),
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
            new BLOCK('L0', [
              new PUSH(3),
              new STORE_GLOBAL('x', 'INTEGER'),
              new PUSH(4),
              new STORE_GLOBAL('y', 'INTEGER'),
              new PUSH(0),
              new STORE_GLOBAL('min', 'INTEGER'),
            ]),
            new IfElse(
              new cEXPR(
                '<',
                new EXPR([new LOAD_GLOBAL('x', 'INTEGER')]),
                new EXPR([new LOAD_GLOBAL('y', 'INTEGER')]),
                'INTEGER'
              ),
              [
                new BLOCK('L1', [
                  new LOAD_GLOBAL('x', 'INTEGER'),
                  new STORE_GLOBAL('min', 'INTEGER'),
                ]),
              ],
              [
                new BLOCK('L2', [
                  new LOAD_GLOBAL('y', 'INTEGER'),
                  new STORE_GLOBAL('min', 'INTEGER'),
                ]),
              ]
            ),
            new BLOCK('L3', [
              new LOAD_GLOBAL('min', 'INTEGER'),
              new PRINT('INTEGER'),
              new PUSH(0),
              new RETURN('INTEGER'),
            ]),
          ]),
        ])
      )
    )
  })

  test('format expected', async () => {
    // const { labelCount } = await import('./blocks')
    expect(Format.program(compiled)).toEqual(`global x int;
global y int;
global min int;
func main() int {
    BLOCK('L0',[
        PUSH(3),
        STORE_GLOBAL(x),
        PUSH(4),
        STORE_GLOBAL(y),
        PUSH(0),
        STORE_GLOBAL(min)
    ])
    if EXPR([LOAD_GLOBAL(x)]) < EXPR([LOAD_GLOBAL(y)]) {
        BLOCK('L1',[
            LOAD_GLOBAL(x),
            STORE_GLOBAL(min)
        ])
    } else {
        BLOCK('L2',[
            LOAD_GLOBAL(y),
            STORE_GLOBAL(min)
        ])
    }
    BLOCK('L3',[
        LOAD_GLOBAL(min),
        PRINT(),
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
              new BLOCK('L0', [
                new PUSH(1),
                new STORE_GLOBAL('result', 'INTEGER'),
                new PUSH(1),
                new STORE_GLOBAL('x', 'INTEGER'),
              ]),
              new While(
                new cEXPR(
                  '<',
                  new EXPR([new LOAD_GLOBAL('x', 'INTEGER')]),
                  new EXPR([new PUSH(10)]),
                  'INTEGER'
                ),
                [
                  new BLOCK('L1', [
                    new LOAD_GLOBAL('result', 'INTEGER'),
                    new LOAD_GLOBAL('x', 'INTEGER'),
                    new MUL('INTEGER'),
                    new STORE_GLOBAL('result', 'INTEGER'),
                    new LOAD_GLOBAL('x', 'INTEGER'),
                    new PUSH(1),
                    new ADD('INTEGER'),
                    new STORE_GLOBAL('x', 'INTEGER'),
                  ]),
                ]
              ),
              new BLOCK('L2', [
                new LOAD_GLOBAL('result', 'INTEGER'),
                new PRINT('INTEGER'),
                new PUSH(0),
                new RETURN('INTEGER'),
              ]),
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
    BLOCK('L0',[
        PUSH(1),
        STORE_GLOBAL(result),
        PUSH(1),
        STORE_GLOBAL(x)
    ])
    while EXPR([LOAD_GLOBAL(x)]) < EXPR([PUSH(10)]) {
        BLOCK('L1',[
            LOAD_GLOBAL(result),
            LOAD_GLOBAL(x),
            MUL(),
            STORE_GLOBAL(result),
            LOAD_GLOBAL(x),
            PUSH(1),
            ADD(),
            STORE_GLOBAL(x)
        ])
    }
    BLOCK('L2',[
        LOAD_GLOBAL(result),
        PRINT(),
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
              new BLOCK('L0', [
                new LOAD_LOCAL('x', 'INTEGER'),
                new PUSH(1),
                new ADD('INTEGER'),
                new STORE_LOCAL('x', 'INTEGER'),
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
              new BLOCK('L1', [
                new PUSH(10),
                new STORE_GLOBAL('x', 'INTEGER'),
                new PUSH(1035),
                new LOAD_GLOBAL('x', 'INTEGER'),
                new CALL('add1', 1),
                new ADD('INTEGER'),
                new PRINT('INTEGER'),
                new LOAD_GLOBAL('x', 'INTEGER'),
                new PRINT('INTEGER'),
                new PUSH(0),
                new RETURN('INTEGER'),
              ]),
            ]
          ),
        ])
      )
    )
  })

  test('format expected', () => {
    expect(Format.program(compiled)).toEqual(`func add1(x int) int {
    BLOCK('L0',[
        LOAD_LOCAL(x),
        PUSH(1),
        ADD(),
        STORE_LOCAL(x),
        LOAD_LOCAL(x),
        RETURN()
    ])
}

global x int;
func main() int {
    BLOCK('L1',[
        PUSH(10),
        STORE_GLOBAL(x),
        PUSH(1035),
        LOAD_GLOBAL(x),
        add1(),
        ADD(),
        PRINT(),
        LOAD_GLOBAL(x),
        PRINT(),
        PUSH(0),
        RETURN()
    ])
}
`)
  })
})
