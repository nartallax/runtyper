# RUNTYPER

A library that stores type information in code for runtime to grab.  
Mainly intended for validation. Other uses are possible, but not really kept in mind.  

PERFORMANCE CONCERNS

POSSIBLE CAVEATS (inferrence)

why types inferred the way they are

module pruning

optional === undefined

more strict union/intersection object checking
union check errors pointing to last error
union/intersection + object with index (tests here)

TBD

can add validators to aliases of primitive types
check all the TODOs
support external types (consider never including class declarations and/or interfaces with function property values in code: such types will never produce a validator, but can easily make js generated code infinitely times larger)
test for optional function params
test for function params with defaults
test for function params with spread
generic parameters of functions? what types will be returned? what validator will be built?
validator builder flag tests
discriminated union optimization (through switch) and tests (don't forget two-field keys)
simplify trivial cases of intersections, as well as unions, in simplifier output
rewrite validator builder: reuse functions between validators
test: recursive types with two cycles instead of just one
