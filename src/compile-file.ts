// I've isolated node dependencies (fs, path) to parse/file and compile-file
// so the Wab compiler can potentially be packaged up for browser usage.
import { writeFileSync } from 'fs'
import { resolve, parse } from 'path'
import { parseFile } from './parse'
import { compile } from './compile'
import { Format } from './format'

export function compileToLLVM(filename: string, output?: string): void {
  const source = parseFile(filename, true)
  const compiled = compile(source)
  const outputPath = output
    ? resolve(process.cwd(), output)
    : resolve(parse(filename).dir, parse(filename).name + '.ll')
  return writeFileSync(outputPath, Format.program(compiled, true))
}
