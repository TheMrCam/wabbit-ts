import { ADD, Instruction, MUL, PRINT, PUSH, REGISTER } from './instruction'
import { convertInstructions, convertInstruction, Stack } from './llvm'

describe('convertInstruction', { concurrent: true }, () => {
  test('PUSH', () => {
    const stack: Stack = []
    expect(convertInstruction(new PUSH(0, 'INTEGER'), stack, g)).toBeUndefined()
    expect(stack).toEqual([[0, 'INTEGER']])
  })
  // one regular instruction so you can see what the test looks like
  test('ADD', () => {
    const stack: Stack = [
      [1, 'INTEGER'],
      [2, 'INTEGER'],
    ]
    expect(convertInstruction(new ADD('INTEGER'), stack, g)).toEqual(
      '%r = add i32 1, 2'
    )
    expect(stack).toEqual([[new REGISTER('%r'), 'INTEGER']])
  })
  test('MUL', () =>
    testInstruction({
      instruction: new MUL('INTEGER'),
      stack: [
        [4, 'INTEGER'],
        [new REGISTER('%r1'), 'INTEGER'],
      ],
      expected: '%r = mul i32 4, %r1',
      expectedStack: [[new REGISTER('%r'), 'INTEGER']],
    }))
  // TODO: add all the other tests
})

const g = () => new REGISTER('%r')
const testInstruction = ({
  expected,
  instruction,
  stack,
  expectedStack, // = [[g(), 'INTEGER']],
  generate = g,
}: {
  expected: string
  instruction: Instruction
  stack: Stack
  expectedStack?: Stack
  generate?: () => REGISTER
}): void => {
  expect(convertInstruction(instruction, stack, generate)).toEqual(expected)
  expect(stack).toEqual(expectedStack)
}
