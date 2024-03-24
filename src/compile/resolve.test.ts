import {
  Add,
  Assign,
  Call,
  Expression,
  Func,
  GlobalName,
  GlobalVar,
  IfElse,
  Integer,
  LessThan,
  LocalName,
  LocalVar,
  Multiply,
  Name,
  Print,
  Program,
  Return,
  VarDecl,
  VarInit,
  While,
} from '../ast'
import { resolveProgram } from './resolve'
import { Format } from '../format'
import { deinitProgram } from './deinit' // need VarDecl from deinit pass

describe('resolver tests', { concurrent: true }, () => {
  //   test.skip('wab1 program 4', () => {
  //     const source = `func add1(x) {
  //     x = x + 1;
  //     return x;
  // }

  // var x;
  // x = 10;
  // print 1035 + add1(x);
  // print x;`
  //     const x = new Name('x')
  //     const argX = new Name('x')
  //     const add1 = new Func(new Name('add1'), argX, [
  //       new Assign(argX, new Add(argX, new Integer(1))),
  //       new Return(argX),
  //     ])
  //     const program = new Program([
  //       add1,
  //       new VarDecl(x),
  //       new Assign(x, new Integer(10)),
  //       new Print(new Add(new Integer(1035), new Call(add1, x))),
  //       new Print(x),
  //     ])
  //     const resolved = resolveProgram(program)
  //     const globalX = new GlobalName('x')
  //     const localArgX = new LocalName('x')
  //     const globalAdd1 = new Func(new GlobalName('add1'), localArgX, [
  //       new Assign(localArgX, new Add(localArgX, new Integer(1))),
  //       new Return(localArgX),
  //     ])
  //     expect(resolved).toEqual(
  //       new Program([
  //         globalAdd1,
  //         new GlobalVar(globalX),
  //         new Assign(globalX, new Integer(10)),
  //         new Print(new Add(new Integer(1035), new Call(globalAdd1, globalX))),
  //         new Print(globalX),
  //       ])
  // )
  // })
  test('block scoping', () => {
    /*
var x = 2;         // Global
if x < 10 {
    var y = x + 1; // Local
    print y;
}
*/
    const x = new Name('x', 'INTEGER')
    const y = new Name('y', 'INTEGER')
    const program = deinitProgram(
      new Program([
        new VarInit(x, new Integer(2)),
        new IfElse(new LessThan(x, new Integer(10)), [
          new VarInit(y, new Add(x, new Integer(1))),
          new Print(y),
        ]),
      ])
    )

    expect(resolveProgram(program)).toEqual(
      new Program([
        new GlobalVar(new GlobalName('x', 'INTEGER')),
        new Assign(new GlobalName('x', 'INTEGER'), new Integer(2)),
        new IfElse(
          new LessThan(new GlobalName('x', 'INTEGER'), new Integer(10)),
          [
            new LocalVar(new LocalName('y', 'INTEGER')),
            new Assign(
              new LocalName('y', 'INTEGER'),
              new Add(new GlobalName('x', 'INTEGER'), new Integer(1))
            ),
            new Print(new LocalName('y', 'INTEGER')),
          ]
        ),
      ])
    )
  })

  test('shadowing', () => {
    /*
var x = 2;           // Global

func f(y) {
    var x = y * y;   // Local (NOT the same x as global)
    return x;
}

print f(x);     // --> 4
print x;        // --> 2    
*/

    const x = new Name('x', 'INTEGER')
    const y = new Name('y', 'INTEGER')
    const f = new Func(new Name('f', 'INTEGER'), y, [
      new VarInit(x, new Multiply(y, y)),
      new Return(x),
    ])
    const program = deinitProgram(
      new Program([
        new VarInit(x, new Integer(2)),
        f,
        new Print(new Call(f.name, x)),
        new Print(x),
      ])
    )

    const globalX = new GlobalName('x', 'INTEGER')
    const localY = new LocalName('y', 'INTEGER')
    const globalF = new Func(new GlobalName('f', 'INTEGER'), localY, [
      new LocalVar(new LocalName('x', 'INTEGER')),
      new Assign(new LocalName('x', 'INTEGER'), new Multiply(localY, localY)),
      new Return(new LocalName('x', 'INTEGER')),
    ])
    expect(resolveProgram(program)).toEqual(
      new Program([
        new GlobalVar(globalX),
        new Assign(globalX, new Integer(2)),
        globalF,
        new Print(new Call(globalF.name, globalX)),
        new Print(globalX),
      ])
    )
  })

  test('a puzzler', () => {
    /*
var x = 2;        // Global

func f(y) {
    print x;         // --> ???
    var x = y * y;
    print x;         // --> ???
    return x;
}

print f(10);  
print x;             // --> ???
*/

    const program = deinitProgram(
      new Program([
        new VarInit(new Name('x', 'INTEGER'), new Integer(2)),
        new Func(new Name('f', 'INTEGER'), new Name('y', 'INTEGER'), [
          new Print(new Name('x', 'INTEGER')),
          new VarInit(
            new Name('x', 'INTEGER'),
            new Multiply(new Name('y', 'INTEGER'), new Name('y', 'INTEGER'))
          ),
          new Print(new Name('x', 'INTEGER')),
          new Return(new Name('x', 'INTEGER')),
        ]),

        new Print(new Call(new Name('f', 'INTEGER'), new Integer(10))),
        new Print(new Name('x', 'INTEGER')),
      ])
    )

    expect(resolveProgram(program)).toEqual(
      new Program([
        new GlobalVar(new GlobalName('x', 'INTEGER')),
        new Assign(new GlobalName('x', 'INTEGER'), new Integer(2)),
        new Func(
          new GlobalName('f', 'INTEGER'),
          new LocalName('y', 'INTEGER'),
          [
            new Print(new GlobalName('x', 'INTEGER')),
            new LocalVar(new LocalName('x', 'INTEGER')),
            new Assign(
              new LocalName('x', 'INTEGER'),
              new Multiply(
                new LocalName('y', 'INTEGER'),
                new LocalName('y', 'INTEGER')
              )
            ),
            new Print(new LocalName('x', 'INTEGER')),
            new Return(new LocalName('x', 'INTEGER')),
          ]
        ),
        new Print(new Call(new GlobalName('f', 'INTEGER'), new Integer(10))),
        new Print(new GlobalName('x', 'INTEGER')),
      ])
    )
  })
})

describe('formatter works', { concurrent: true }, () => {
  test('wab3 example program', () => {
    const expected = `global x int;
global[x] = 42;
func f(y int) int {
    local t;
    local[t] = global[x] * local[y];
    return local[t];
}

print f(global[x]);`
    const program = resolveProgram(
      deinitProgram(
        new Program([
          new VarInit(new Name('x', 'INTEGER'), new Integer(42)),
          new Func(new Name('f', 'INTEGER'), new Name('y', 'INTEGER'), [
            new VarInit(
              new Name('t', 'INTEGER'),
              new Multiply(new Name('x', 'INTEGER'), new Name('y', 'INTEGER'))
            ),
            new Return(new Name('t', 'INTEGER')),
          ]),
          new Print(
            new Call(new Name('f', 'INTEGER'), new Name('x', 'INTEGER'))
          ),
        ])
      )
    )

    expect(Format.program(program)).toEqual(expected)
  })
})
