# Getting Started

_All commands are assuming `pwd` is `compilers_2024_03`, a.k.a. the repo root; and that you have `node` available in your environment_

## Install NPM dependencies

```sh
npm install
```

## Run test suites

```sh
npm run test
```

### See phase output

I've included a special test suite and command that uses Vitest to output each stage of the compiler process to stdout.

```sh
npm run printPhases
```

_Note: after this command, press 't' and start typing to filter to specific phase(s) (RegExp)_

## Compile file

The following `npm` command allows you to parse a source Wab file and output LLVM to a file.

```
npm run dev <path/to/source.wb> (path/to/out.ll)
```

The output file is optional, and if not provided the output will be `path/to/source.ll`.

`wab/tests` contains a few Wab source code files you may test on.
