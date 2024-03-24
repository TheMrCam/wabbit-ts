#!/usr/bin/env node
import { compileToLLVM } from './compile-file'

compileToLLVM(process.argv[2], process.argv[3])
