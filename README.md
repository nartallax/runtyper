# RUNTYPER

A library that stores type information in code for runtime to grab.  
Mainly intended for validation. Other uses are possible, but not really kept in mind.  

TBD:
POSSIBLE CAVEATS (inferrence, code bloat (with external modules), many things not supported because of too complex behaviour, complicated imports)
top-levelness of functons is required
why types inferred the way they are
module pruning
optional === undefined
more strict union/intersection object checking
union check errors pointing to whatever (same for overloaded functions)
union/intersection + object with index (tests here)

local goals:

check d.ts for type leaks
check all the TODOs
