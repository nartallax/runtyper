# RUNTYPER

Typescript validation library.
Stores types during compile time in code, allows to build validators based on types in runtime. Primarily intended for validation of incoming JSON, but has more uses than that.

## Example

	import {Runtyper} from "@nartallax/runtyper"

	interface Point { x: number, y: number }

	function invertShiftPoint(input: Point, shift: number = 0): Point {
		return {x: -input.x + shift, y: -input.y + shift}
	}

	let checker = Runtyper.getArrayParameterChecker(invertShiftPoint)

	checker([{x: 5, y: 10}]) // no error
	checker([{x: "something else", y: 10}]) // error!

## Install

This library is a typescript transformer. That means you need something that is able to launch the transformer. Easiest way will be to use [ttypescript](https://github.com/cevek/ttypescript).

Install the package: `npm install --save @nartallax/runtyper`  
Add reference to transformer in tsconfig.json:

	"compilerOptions": {		
		"plugins": [{
			"transform": "@nartallax/runtyper", 
			"type":"program"
		}]
		... other compiler options ...
	}

## Usage

To validate arguments of some function, you need to build parameter checker first.  
To build such checker, you can use `Runtyper.getArrayParameterChecker` or `Runtyper.getObjectParameterChecker`, depending on how you prefer to receive your arguments. Array checker is preferred, because it allows function to receive destructurized arguments. Object checker will not only validate types of arguments, but also will place arguments into array for you to call the function.  
You also have `Runtyper.getPublicMethodsOfClass` that can help you get the functions without referencing them one by one, but it's up to you to organize it.

External types (that is, types that come not from your code, but from some packages) are not included by default, and you will get runtime error if you will try to build validator for a type that is external or refers to external. You can allow types from specific external packages to be included, but this may result in unpredictable code bloat, see below. Adding package to allowed is done with `includeExternalTypesFrom` parameter:

	"compilerOptions": {
		"plugins": [{
			"transform": "@nartallax/runtyper",
			"type":"program",
			"includeExternalTypesFrom": [
				"typescript",
				"@types/node"
			]
		}]
		... other compiler options ...
	}

Class instances are always an error by default (because you can't pass class instance through JSON). But if you use something else to pass your data around, you may want to allow classes. It is done through validator builder parameter:

	Runtyper.getArrayParameterChecker(myFn, {onClassInstance: "check_by_instanceof"})

By default `unknown` and `any` types are considered bad and will result in runtime error when building validator. But you can allow them if you really mean to allow any value to be valid for this type. You can still attach an user validator to alias to any/unknown type and have some validation, see below.

	Runtyper.getArrayParameterChecker(myFn, {
		onUnknown: "allow_anything",
		onAny: "allow_anything"
	})

By default objects are not expected to have any extra fields; any field that is not known to validator (that is, not appear in type of the object) will result in error. But you can disable this behaviour, so any unknown fields will be just allowed. Note that this may be dangerous, as it may allow any value even on known fields when checking union type. (there are caveats about union checking, see below)

	Runtyper.getArrayParameterChecker(myFn, { onUnknownFieldInObject: "allow_anything" })

The library stores a lot of information about data structures. But you probably won't need it when you done building all the checkers you need. So there is function that will remove all this type information to free up some memory: `Runtyper.cleanup()`

You can attach arbitrary validation logic to types. That logic (named user validator) is executed after every default check on the type confirmed that the value matches the type. You need to attach every user validator you want before building any validators, otherwise some user validators will never be invoked. Attaching an user validator is done with `Runtyper.attachValidator`. Two things to note here: generic argument is always mandatory (you can't rely on inferrence here) - it allows transformer to point to specific type; and the function is expected to return true if value is bad, and false if value is good (not vice-versa):

	type MyOddNumber = number
	Runtyper.attachValidator<MyOddNumber>(value => value % 2 !== 1)

If you are attaching user validator to a type with generic parameter, an user validator attached with `Runtyper.attachValidator` will be invoked on a type with any value of generic argument; to attach user validator to a type with specific generic argument, use `Runtyper.attachValidatorWithSpecificGenericParams`. Note that such user validator won't be invoked if generic argument is anything else but this specific type; you may think it will be invoked if supertype is passed as generic argument, but it will not.

## How it works

1. In compile time the transformer goes through type structures in AST and generates values that describe this structures. Then it appends code that stores these values inside the library to the end of file. It's important to do it that way, because transformers are executed per-file and not per-project; transformer never has complete map of types of the whole project at once. Also incremental compilation is a thing, and can be a trap for transformer that relies on whole project being transformed at once.
2. Code is executed, type structures are put into library's storage.
3. Build of validator is requested by user. Type is found in the storage; before doing anything with it we need to simplify the type. Source types are complicated, full of references and complex type expressions like mapped types or conditional types; simplified types have none of that, just a structure of the value.
4. A validator is built using simple type from previous step as a template. A validator is a function which code is put together in runtime. That way we can actually traverse type structure only once (and not each time we need to validate a value)

If you're curious you can try to invoke parts of this process with `Runtyper.getType`, `Runtyper.getSimplifier` and `Runtyper.getValidatorBuilder`.  

## Caveats

There are lots of them.

1. All functions and classes (that you want to be able to build checkers for) are required to be top-level (namespace content is considered top-level). That is, if you create function dynamically inside other function then types of parameters of that dynamically created function won't be stored, and you won't be able to build checker.  
2. Type structures are stored in the file they are defined in. The consequence of that is if the file with the structure is not executed before a checker that relies on it is built then you will get "not found" error.
3. Explicit is better than implicit. You are required to explicitly put types for arguments of functions you want checked, even if inferrence is possible. Also types of some variables won't be inferred if you use typeof, because the library cannot rely on inferrence done by typescript compiler, and that means that the library has to do inferrence by itself.
4. JS code bloat. For each type, interface or toplevel variable, function or class in your code there will be generated a value that describes structure of the types. It may bloat your code severely. It's not a big deal for server-side applications, but you may want to avoid this library for client-side applications. Also code bloat becomes unpredictable when external types are allowed, because a copy of each referenced external type must be placed in each file where the type is referenced.
5. Many things are explicitly not supported. Typescript is great and complex language, and there are a lot of ways to use it, and this advantage becomes pain when it comes to writing something that works with the code. Don't get me wrong, a lot of fairly complex cases and most of type constructs will work just fine; you just can get a "not supported" error if you will do something that I did not expect (like `type X = "a" infers "b"? "c": never` will fail).
6. Imports are complicated. That's why even after testing I'm not sure that I covered all the cases. If you found that something is not found that should be found, feel free to create an issue.
7. When something is marked optional (function parameters, object fields etc), an `undefined` value is also allowed there. It's fine in most of the cases, and makes processing of mapped index types a little easier.  
8. Validation of union types is not the best in the world. Error messages when validating a union may sometimes be just an error of the last type of the union, and sometimes error about root of union value (but only if there is really non-matching value; if value is good, validation of it will not result an error). Also union types are validated more strictly than typescript does it; for example, the following is fine by typescript's standards, but will result in error if validated: `function fn(arg: {a: number} | {b: number}): void { ... }; fn({a: 5, b: 10})`

## Naming

Word-mash of `runtime` and `typings`.
