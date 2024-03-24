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
  Multiply,
  Name,
  Print,
  Program,
  Return,
  VarDecl,
  VarInit,
  While,
} from '../ast'
import { Format } from '../format'

import { Deinit } from './deinit'
import { Fold } from './fold'
import { Resolve } from './resolve'
import { Returns } from './returns'
import { Unscript } from './unscript'

function compile(program: Program): Program {
  return Returns.program(
    Unscript.program(Resolve.program(Deinit.program(Fold.program(program))))
  )
}

describe('compiler passes', { concurrent: true }, () => {
  describe('wab1 program 1', () => {
    const source = `var x = 10;
    x = x + 1;
    print (23 * 45) + x;`

    const x = new Name('x', 'INTEGER')
    const assign = new Assign(x, new Add(x, new Integer(1)))
    const printAddX = (e: Expression) => new Print(new Add(e, x))
    const encoded = new Program([
      new VarInit(x, new Integer(10)),
      assign,
      printAddX(new Multiply(new Integer(23), new Integer(45))),
    ])

    const compiled = compile(encoded)
    test('expected compiled', () => {
      expect(compiled).toEqual(
        new Program([
          // new VarDecl(x),
          new GlobalVar(new GlobalName('x', 'INTEGER')),
          new Func(new GlobalName('main', 'INTEGER'), undefined, [
            new Assign(new GlobalName('x', 'INTEGER'), new Integer(10)),
            new Assign(
              new GlobalName('x', 'INTEGER'),
              new Add(new GlobalName('x', 'INTEGER'), new Integer(1))
            ),
            new Print(
              new Add(new Integer(1035), new GlobalName('x', 'INTEGER'))
            ),
            new Return(new Integer(0)),
          ]),
          // assign,
          // printAddX(new Integer(1035)),
        ])
      )
    })
    test('expected formatted', () => {
      /* pre-resolve & unscript:
const formatted = `var x;
x = 10;
x = x + 1;
print 1035 + x;`
*/
      const formatted = `global x int;
func main() int {
    global[x] = 10;
    global[x] = global[x] + 1;
    print 1035 + global[x];
    return 0;
}
`

      expect(Format.program(compiled)).toEqual(formatted)
    })
  })

  describe('wab1 program 2', () => {
    const source = `var x = 3;
var y = 4;
var min = 0;
if x < y {
    min = x;
} else {
    min = y;
}
print min;`

    const x = new Name('x', 'INTEGER')
    const y = new Name('y', 'INTEGER')
    const min = new Name('min', 'INTEGER')
    const three = new Integer(3)
    const four = new Integer(4)
    const zero = new Integer(0)
    const encoded = new Program([
      new VarInit(x, three),
      new VarInit(y, four),
      new VarInit(min, zero),
      new IfElse(new LessThan(x, y), new Assign(min, x), new Assign(min, y)),
      new Print(min),
    ])

    const compiled = compile(encoded)
    test('expected compiled', () => {
      expect(compiled).toEqual(
        new Program([
          new GlobalVar(new GlobalName('x', 'INTEGER')),
          new GlobalVar(new GlobalName('y', 'INTEGER')),
          new GlobalVar(new GlobalName('min', 'INTEGER')),
          new Func(new GlobalName('main', 'INTEGER'), undefined, [
            new Assign(x, three),
            new Assign(y, four),
            new Assign(min, zero),
            new IfElse(
              new LessThan(x, y),
              new Assign(min, x),
              new Assign(min, y)
            ),
            new Print(min),
            new Return(new Integer(0)),
          ]),
        ])
      )
    })
    test('expected formatted', () => {
      /* pre-resolve & unscript: 
const formatted = `var x;
x = 3;
var y;
y = 4;
var min;
min = 0;
if x < y {
    min = x;
} else {
    min = y;
}
print min;`
*/
      const formatted = `global x int;
global y int;
global min int;
func main() int {
    global[x] = 3;
    global[y] = 4;
    global[min] = 0;
    if global[x] < global[y] {
        global[min] = global[x];
    } else {
        global[min] = global[y];
    }
    print global[min];
    return 0;
}
`
      expect(Format.program(compiled)).toEqual(formatted)
    })
  })

  describe('wab1 program 3', () => {
    const source = `var result = 1;
var x = 1;
while x < 10 {
    result = result * x;
    x = x + 1;
}
print result;`

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

    const compiled = compile(encoded)
    test('expected compiled', () => {
      expect(compiled).toEqual(
        new Program([
          // new VarDecl(result),
          new GlobalVar(new GlobalName('result', 'INTEGER')),
          new GlobalVar(new GlobalName('x', 'INTEGER')),
          new Func(new GlobalName('main', 'INTEGER'), undefined, [
            new Assign(result, one),
            // new VarDecl(x),
            new Assign(x, one),
            new While(new LessThan(x, new Integer(10)), [
              new Assign(result, new Multiply(result, x)),
              new Assign(x, new Add(x, one)),
            ]),
            new Print(result),
            new Return(new Integer(0)),
          ]),
        ])
      )
    })
    test('expected formatted', () => {
      /* pre-resolve & unscript:
const formatted = `var result;
result = 1;
var x;
x = 1;
while x < 10 {
    result = result * x;
    x = x + 1;
}
print result;`
*/
      const formatted = `global result int;
global x int;
func main() int {
    global[result] = 1;
    global[x] = 1;
    while global[x] < 10 {
        global[result] = global[result] * global[x];
        global[x] = global[x] + 1;
    }
    print global[result];
    return 0;
}
`
      expect(Format.program(compiled)).toEqual(formatted)
    })
  })

  describe('wab1 program 4', () => {
    const source = `func add1(x int) int {
      x = x + 1;
      return x;
  }
  
  var x = 10;
  print (23 * 45) + add1(x);
  print x;`

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

    const compiled = compile(encoded)
    test('expected compiled', () => {
      expect(compiled).toEqual(
        new Program([
          new Func(
            new GlobalName('add1', 'INTEGER'),
            new LocalName('x', 'INTEGER'),
            [
              new Assign(
                new LocalName('x', 'INTEGER'),
                new Add(new LocalName('x', 'INTEGER'), new Integer(1))
              ),
              new Return(new LocalName('x', 'INTEGER')),
            ]
          ),
          new GlobalVar(new GlobalName('x', 'INTEGER')),
          new Func(new GlobalName('main', 'INTEGER'), undefined, [
            new Assign(new GlobalName('x', 'INTEGER'), new Integer(10)),
            new Print(
              new Add(
                new Integer(1035),
                new Call(
                  new GlobalName('add1', 'INTEGER'),
                  new GlobalName('x', 'INTEGER')
                )
              )
            ),
            new Print(new GlobalName('x', 'INTEGER')),
            new Return(new Integer(0)),
          ]),
        ])
      )
    })
    test('expected formatted', () => {
      /* pre-resolve & unscript:
const formatted = `func add1(x) {
    x = x + 1;
    return x;
}

var x;
x = 10;
print 1035 + add1(x);
print x;
*/
      const formatted = `func add1(x int) int {
    local[x] = local[x] + 1;
    return local[x];
}

global x int;
func main() int {
    global[x] = 10;
    print 1035 + add1(global[x]);
    print global[x];
    return 0;
}
`
      expect(Format.program(compiled)).toEqual(formatted)
    })
  })
})
