# RUNTYPER

A library that stores type information in code for runtime to grab.  
Mainly intended for validation. Other uses are possible, but not really kept in mind.  

PERFORMANCE CONCERNS

POSSIBLE CAVEATS (inferrence)

why types inferred the way they are

module pruning

optional === undefined

TBD

generic parameters of functions? what types will be returned? what validator will be built?
can add validators to aliases of primitive types
check all the TODOs
// TODO: validator option to distinguish between undefined and absent (index type considered)
// TODO: validator option to allow/disallow unknown/any
// TODO: validator option to allow/disallow undefined
// TODO: validator option to allow/disallow extra data on objects, and dont forget about indexed/mapped types
// TODO: validator option to enum checking: just type string/number, or by value set
// TODO: cleanup option after all the validators are built
more tests for relative relations of unknown, never and any (infer, intersection, union)
post-simplification processing (updating the union types?)
