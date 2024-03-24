# wabbit-ts

## What is this?

This repository contains the source code I wrote for [David Beazley's "Write a Compiler"](#write-a-compiler) course, which I took during March 2024.

I thoroughly enjoyed my time under David's guidance, and I'm proud enough of my work that I've chosen to continue (or at least publicly preserve) it in this personal repository.

# Overview

This package is the actual compiler I created for "Wabbit", which accepts wab/wabbi/wabbit source code and, assuming all goes well, outputs valid LLVM code.

## Getting Started

### Install NPM dependencies

```sh
npm install
```

### Run test suites

```sh
npm run test
```

#### See phase output

I've included a special test suite and command that uses Vitest to output each stage of the compiler process to stdout.

```sh
npm run printPhases
```

_Note: after this command, press 't' and start typing to filter to specific phase(s) (RegExp)_

### Compile file

The following `npm` command allows you to parse a source Wab file and output LLVM to a file.

```
npm run dev <path/to/source.wb> (path/to/out.ll)
```

The output file is optional, and if not provided the output will be `path/to/source.ll`.

`wab/tests` contains a few Wab source code files you may test on.

### Compile to executable

```sh
clang path/to/source.ll runtime.c -o path/to/source.exe
```

Since LLVM (and CPUs) don't actually understand printing, or terminals, we need to include `runtime.c` with the clang compilation in order to see the result of the Wabbit programs.

Examples of `runtime.c` are included (by David Beazley) in `wab/misc/`, `wabbi/misc/`, and `wabbit/misc/`

## Supported

- [x] Math operators (`+`, `-`, `*`, `/`)
  - [ ] Implicit precedence
- [x] Conditon operators (`<`, `<=`, `>`, `>=`, `==`, `!=`)
  - [ ] Short circuit
- [x] Integer vs Float type
- [ ] Character type
- [x] Variables
  - [ ] Initialized or Declared (needs testing)
- [x] Functions
  - [ ] Detect branch return (`if c { return } else { return }`)
  - [x] Implicit return type
- [x] While
  - [ ] For
  - [ ] Break/Continue
- [x] If Else
  - [x] Optional `else`
- [x] Print (for supported types)

_Note: this is a non-exhaustive list_

## Where is this going?

Based on the uncompleted tasks and inspiration given to me by David, as well as some of my own dreaming, I could see a few potential uses/futures for this (or something like this):

- Target WebAssembly
- Single-Page Application demo site
- Expand Wabbit into... something else?

# David Beazley

I'll let David describe himself (exerpt from [his website](https://www.dabeaz.com/)):

> Dabeaz is David Beazley, a computer scientist, educator, and researcher with more than 35 years of experience. Dave has been most visible in the Python community where he has created various software packages, given conference talks, tutorials, and is known as the author of Python Distilled (Addison-Wesley), the Python Essential Reference (Addison-Wesley), and the Python Cookbook (O'Reilly Media). He supports this work by offering a variety of advanced computer science and programming courses.

## Write a Compiler

[David Beazley](https://www.dabeaz.com/) (**[`dabeaz`](https://github.com/dabeaz)** on GitHub) guided me (along with 11 or 12 others) through the process of writing a compiler -- from scratch, in a week -- in March 2024.

Firstly, I would recommend the course (or [any course](https://www.dabeaz.com/courses.html)) to anyone even remotely interested, as I consider it one of the most rewarding programming experiences I've ever had.

While the course is taught with Python, he does it without any Python-specific patterns or "hacks", and without _any_ external libraries, so it could really be followed with any language of choice. TypeScript presented a few interesting challenges,

## Copyright

All files in the `wab/`, `wabbi/`, and `wabbit/` directories are considered copyright of David Beazley (**[`dabeaz`](https://github.com/dabeaz)**), unless otherwise specified.

<!-- Copyright 2024 © Cameron Woodbury -->
