import { resolve } from 'path'
import { readFileSync } from 'fs'
import { Program } from '../ast'
import { Parse } from './parse'
import { Parse as ParseWabbit } from './parse-wabbit'
import { tokenize } from './tokenize'
import { checkBraces } from './braces'

export function parseSource(source: string, wabbit = false): Program {
  const parse = wabbit ? ParseWabbit.program : Parse.program
  return parse(checkBraces(tokenize(source)))
}

export function parseFile(filename: string, wabbit = false): Program {
  const path = resolve(process.cwd(), filename)
  return parseSource(readFileSync(path).toString(), wabbit)
}
