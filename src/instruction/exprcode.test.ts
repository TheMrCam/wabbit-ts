import { Add, GlobalName, Integer } from '../ast'
import { expressionInstructions } from './exprcode'
import { ADD, EXPR, LOAD_GLOBAL, PUSH, bEXPR } from './instruction'

import { Program } from '../ast'
import { Deinit } from '../compile/deinit'
import { Fold } from '../compile/fold'
import { Resolve } from '../compile/resolve'
import { Returns } from '../compile/returns'
import { Unscript } from '../compile/unscript'
import { Expressions } from './exprcode'
import { parseFile } from '../parse'
import { Format } from '../format'

function compile(program: Program): Program {
  return Expressions.program(
    Returns.program(
      Unscript.program(Resolve.program(Deinit.program(Fold.program(program))))
    )
  )
}

describe('program1.wb', () => {
  const source = parseFile('wab/tests/program1.wb')
  // console.log(Format.program(compile(source)))
  test.todo('compiles expected')
})

test.todo('program2.wb')
test.todo('program3.wb')
test.todo('program4.wb')

describe('expressionInstructions', { concurrent: true }, () => {
  test('1 + 1', () => {
    expect(
      JSON.stringify(
        expressionInstructions(new Add(new Integer(1), new Integer(1)))
          .instructions
      )
    ).toEqual(
      JSON.stringify([
        new PUSH(1, 'INTEGER'),
        new PUSH(1, 'INTEGER'),
        new ADD('INTEGER'),
      ])
    )
  })

  test('42 + x', () => {
    expect(
      JSON.stringify(
        expressionInstructions(
          new Add(new Integer(1), new GlobalName('x', 'INTEGER'))
        ).instructions
      )
    ).toEqual(
      JSON.stringify(
        new EXPR([
          new PUSH(1, 'INTEGER'),
          new LOAD_GLOBAL('x', 'INTEGER'),
          new ADD('INTEGER'),
        ]).instructions
      )
    )
  })
})
