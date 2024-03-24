import {
  BLOCK,
  CALL,
  CBRANCH,
  EXPR,
  GOTO,
  Instruction,
  LLVM_BLOCK,
  STATEMENT,
  TypelessInstruction,
  typeToLLVM,
} from './instruction'
import {
  Add,
  Expression,
  Program,
  Statement,
  BinaryOperator,
  VarInit,
  Assign,
  Print,
  Name,
  Integer,
  IfElse,
  Condition,
  While,
  Func,
  Return,
  Call,
  VarDecl,
  GlobalName,
  LocalName,
  GlobalVar,
  LocalVar,
  Negate,
  ExprStatement,
  Float,
} from './ast'

export const Format = {
  program: formatProgram,
  statements: formatStatements,
  statement: formatStatement,
  expression: formatExpression,
}

export function formatProgram(program: Program, llvm = false) {
  return (
    (llvm
      ? 'declare i32 @_print_int(i32)\ndeclare i32 @_print_float(double)\n\n'
      : '') + formatStatements(program.statements, 0, llvm)
  )
}

function formatStatements(
  statements: Statement[],
  indent = 0,
  llvm: boolean
): string {
  return statements
    .map((s) => formatStatement(s, indent, llvm))
    .map((s) => ''.padEnd(indent, ' ') + s)
    .join('\n')
}

function formatStatement(s: Statement, indent = 0, llvm: boolean) {
  const pad = ''.padEnd(indent, ' ')
  if (s instanceof GlobalVar) {
    return llvm
      ? `@${s.name.value} = global ${
          s.name.type === 'INTEGER' ? 'i32 0' : 'double 0.0'
        }`
      : `global ${formatName(s.name, false)} ${
          s.name.type === 'INTEGER' ? 'int' : 'float'
        };`
  } else if (s instanceof LocalVar) {
    return `local ${formatName(s.name, false)};`
  } else if (s instanceof VarDecl) {
    return `var ${formatName(s.name)};`
  } else if (s instanceof VarInit) {
    return `var ${formatName(s.name)} = ${formatExpression(s.value)};`
  } else if (s instanceof Assign) {
    return `${formatName(s.name)} = ${formatExpression(s.value)};`
  } else if (s instanceof Print) {
    return `print ${formatExpression(s.value)};`
  } else if (s instanceof IfElse) {
    let code = `if ${formatCondition(s.condition)} {
${formatStatements(s.ifTrue, indent + 4, llvm)}
${pad}}`
    if (s.ifFalse.length) {
      code += ` else {
${formatStatements(s.ifFalse, indent + 4, llvm)}
${pad}}`
    }
    return code
  } else if (s instanceof While) {
    return `while ${formatCondition(s.condition)} {
${formatStatements(s.statements, indent + 4, llvm)}
${pad}}`
  } else if (s instanceof Func) {
    if (llvm) {
      return `define ${s.returnType === 'INTEGER' ? 'i32' : 'double'} @${
        s.name.value
      }(${s.parameters
        .map((n) => `${n.type === 'INTEGER' ? 'i32' : 'double'} %${n.value}`)
        .join(', ')}) {
${formatStatements(s.statements, indent, llvm)}}
`
    }
    return `func ${formatName(s.name, false)}(${s.parameters
      .map(
        (n) =>
          `${formatName(n, false)} ${n.type === 'INTEGER' ? 'int' : 'float'}`
      )
      .join(', ')}) ${s.returnType === 'INTEGER' ? 'int' : 'float'} {
${formatStatements(s.statements, indent + 4, llvm)}
${pad}}
`
  } else if (s instanceof Return) {
    return `return ${formatExpression(s.value)};`
  } else if (s instanceof ExprStatement) {
    return `${formatExpression(s.expression)};`
  } else if (s instanceof STATEMENT) {
    return `STATEMENT([
${s.instructions
  .map(formatInstruction)
  .map((s) => ''.padEnd(indent + 4, ' ') + s)
  .join(',\n')}
${pad}])`
  } else if (s instanceof BLOCK || s instanceof LLVM_BLOCK) {
    return `${llvm ? `${s.label.value}:` : `BLOCK('${s.label.value}',[`}
${s.instructions
  .map(formatInstruction)
  .map((s) => ''.padEnd(indent + 4, ' ') + s)
  .join(`${s instanceof LLVM_BLOCK ? '' : ','}\n`)}
${pad}${llvm ? '' : '])'}` // : `${s.label.value}:`
  } else {
    throw new Error(`Misunderstood statement ${JSON.stringify(s)}`)
  }
}

function formatExpression(e: Expression): string {
  if (e instanceof EXPR) {
    return `EXPR([${e.instructions.map(formatInstruction).join(', ')}])`
  } else if (e instanceof BinaryOperator) {
    const lWrap = ['', '']
    const rWrap = ['', '']
    // if (
    //   (e.left instanceof GlobalName || e.left instanceof LocalName) &&
    //   (e.right instanceof GlobalName || e.right instanceof LocalName)
    // ) {
    //   return `(${formatName(e.left)} ${e.op} ${formatName(e.right)})`
    // }
    if (e.left instanceof BinaryOperator) {
      lWrap[0] = '('
      lWrap[1] = ')'
    }
    if (e.right instanceof BinaryOperator) {
      rWrap[0] = '('
      rWrap[1] = ')'
    }
    return `${lWrap[0]}${formatExpression(e.left)}${lWrap[1]} ${e.op} ${
      rWrap[0]
    }${formatExpression(e.right)}${rWrap[1]}`
  } else if (e instanceof Condition) {
    return formatCondition(e)
  } else if (
    e instanceof Name ||
    e instanceof Integer ||
    e instanceof Float ||
    e instanceof GlobalName ||
    e instanceof LocalName
  ) {
    return formatName(e)
  } else if (e instanceof Call) {
    return `${formatName(e.function, false)}(${e.arguments
      .map(formatExpression)
      .join(', ')})`
  } else if (e instanceof Negate) {
    if (e.expression instanceof BinaryOperator) {
      return `-(${formatExpression(e.expression)})`
    }
    return `-${formatExpression(e.expression)}`
  } else {
    throw new Error(`Misunderstood expression ${JSON.stringify(e)}`)
  }
}

const formatName = (e: Name | Integer, prefix = true) => {
  if (prefix) {
    if (e instanceof GlobalName) {
      return `global[${e.value}]`
    } else if (e instanceof LocalName) {
      return `local[${e.value}]`
    }
  }
  return `${e.value}`
}
const formatCondition = (c: Condition) =>
  `${formatExpression(c.left)} ${c.op} ${formatExpression(c.right)}`

const formatInstruction = (i: TypelessInstruction | Instruction | string) => {
  if (i instanceof CALL) {
    return `${i.name}()`
  } else if (i instanceof GOTO) {
    return `GOTO('${i.label.value}')`
  } else if (i instanceof CBRANCH) {
    return `CBRANCH('${i.left.value}', '${i.right.value}')`
  } else if (typeof i === 'string') {
    return i
  }
  return 'value' in i
    ? `${i.constructor.name}(${i.value})`
    : `${i.constructor.name}()`
}
