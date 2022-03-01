# RUNTYPER

A library that stores type information in code for runtime to grab.  
Mainly intended for validation. Other uses are possible, but not really kept in mind.  

TBD:
POSSIBLE CAVEATS (inferrence, code bloat, many things not supported because of too complex behaviour)
why types inferred the way they are
module pruning
optional === undefined
more strict union/intersection object checking
union check errors pointing to whatever
union/intersection + object with index (tests here)

local goals:

support binary classes (buffer, arraybuffer, typed arrays)
support external types (consider never including class declarations and/or interfaces with function property values in code: such types will never produce a validator, but can easily make js generated code infinitely times larger)
can add validators to aliases of primitive types

test for optional function params
test for function params with defaults
test for function params with spread
generic parameters of functions? what types will be returned? what validator will be built?

check d.ts for type leaks
check all the TODOs
