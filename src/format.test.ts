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
} from './ast'
import { Format } from './format'

describe('wab1 - the model', { concurrent: true }, () => {
  test('program 1: variables, math, and printing', () => {
    const source = `var x = 10;
x = x + 1;
print (23 * 45) + x;`
    const x = new Name('x', 'INTEGER')
    const encoded = new Program([
      new VarInit(x, new Integer(10)),
      new Assign(x, new Add(x, new Integer(1))),
      new Print(new Add(new Multiply(new Integer(23), new Integer(45)), x)),
    ])
    expect(Format.program(encoded)).toEqual(source)
  })
  test('program 2: decision making', () => {
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
    const encoded = new Program([
      new VarInit(x, new Integer(3)),
      new VarInit(y, new Integer(4)),
      new VarInit(min, new Integer(0)),
      new IfElse(new LessThan(x, y), new Assign(min, x), new Assign(min, y)),
      new Print(min),
    ])
    expect(Format.program(encoded)).toEqual(source)
  })
  test('program 3: looping', () => {
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
    expect(Format.program(encoded)).toEqual(source)
  })
  test('program 4: functions', () => {
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
    expect(Format.program(encoded)).toEqual(source)
  })
})
