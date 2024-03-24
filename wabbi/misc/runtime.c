/* For LLVM, you need some runtime functions to produce ouput.  Use
   these and include them in final compilation with clang. */

#include <stdio.h>

int _print_int(int x) {
  printf("Out: %i\n", x);
  return 0;
}
