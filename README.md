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
// TODO: validator option to allow/disallow unknown/any
// TODO: validator option to allow/disallow extra data on objects, and dont forget about indexed/mapped types
// TODO: validator option about return type: boolean/error description/throw
// TODO: cleanup option after all the validators are built
look at names on which simplified types are cached
support external types (consider never including class declarations and/or interfaces with function property values in code: such types will never produce a validator, but can easily make js generated code infinitely times larger)
