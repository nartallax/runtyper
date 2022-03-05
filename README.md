# RUNTYPER

A library that stores type information in code for runtime to grab.  
Mainly intended for validation. Other uses are possible, but not really kept in mind.  

TBD:
POSSIBLE CAVEATS (inferrence, code bloat (with external modules), many things not supported because of too complex behaviour, complicated imports)
why types inferred the way they are
module pruning
optional === undefined
more strict union/intersection object checking
union check errors pointing to whatever
union/intersection + object with index (tests here)

local goals:

test for optional function params
test for function params with defaults
test for function params with spread
test for functions that expect external types, including those mixed into other types like interface fields or generic params
generic parameters of functions? what types will be returned? what validator will be built?

check d.ts for type leaks
check all the TODOs
