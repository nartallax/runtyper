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

support binary classes (buffer, arraybuffer, typed arrays)
test for check of imported classes (external included)
test for re-imported external types/values (with and without namespace, from ordinary and ambient modules!)
test for imported external types (with and without namespace, from ordinary and ambient modules!)
test import *
test for classes with generic arguments
can add validators to aliases of primitive types
can add validators to external types
test for gettype of external type

test for optional function params
test for function params with defaults
test for function params with spread
test for functions that expect external types, including those mixed into other types like interface fields or generic params
generic parameters of functions? what types will be returned? what validator will be built?

check d.ts for type leaks
check all the TODOs
