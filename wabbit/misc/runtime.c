/* For LLVM, you need some runtime functions to produce ouput.  Use
   these and include them in final compilation with clang. */

#include <stdio.h>

int _print_int(int x) {
  printf("Out: %i\n", x);
  return 0;
}

int _print_float(double x) {
  printf("Out: %lf\n", x);
  return 0;
}

int _print_char(int x) {
  printf("%c", x);
  return 0;
}
