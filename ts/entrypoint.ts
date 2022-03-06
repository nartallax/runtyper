import {ToolboxTransformer} from "@nartallax/toolbox-transformer"
import * as runtime from "runtime/runtime"
import * as TypeStringifier from "runtime/type_stringifier"
import * as Tsc from "typescript"
import {RuntyperTricks} from "transformer/tricks"
import {Transformer, TransParams} from "transformer/transformer"
import {TypeSimplifier} from "runtime/type_simplifier"
import {ValidatorBuilderImpl} from "codegen/validator_builder"
import {AmbientModuleCache} from "transformer/ambient_module_cache"
import {FunctionArgumentChecker} from "runtime/function_argument_checker"

export namespace Runtyper {

	/** Parameters that transformer take through tsconfig.json
	 * All of these options have defaults, so you may define them only if you really need to */
	export interface TransformerParameters {
		/** Name of the transformer module.
		 * This name will be inserted in generated code when the code needs to refer to this module. */
		moduleName: string
		/** An identifier that will be used in generated code to refer to this module when imported */
		moduleIdentifier: string
		/** A set of npm package names. If your code references type from one of these packages, copy of the type structure or reference to class will be included in file where it is referenced. */
		includeExternalTypesFrom: string[]
	}

	export interface ValidatorBuilder {
		build<T = unknown>(type: SimpleType): (value: unknown) => value is T
		buildNonThrowing(type: SimpleType): (value: unknown) => ValidationError | null
	}

	export interface ValidatorBuilderOptions {
		readonly onUnknown: "throw_on_build" | "allow_anything"
		readonly onAny: "throw_on_build" | "allow_anything"
		readonly onUnknownFieldInObject: "validation_error" | "allow_anything"
		readonly onNaNWhenExpectedNumber: "validation_error" | "allow"
		readonly onClassInstance: "throw_on_build" | "check_by_instanceof"
	}

	function getFullValidatorBuilderOpts(opts?: Partial<ValidatorBuilderOptions>): ValidatorBuilderOptions {
		return {
			onAny: "throw_on_build",
			onUnknown: "throw_on_build",
			onUnknownFieldInObject: "validation_error",
			onNaNWhenExpectedNumber: "validation_error",
			onClassInstance: "throw_on_build",
			...(opts || {})
		}
	}

	export interface FunctionArgumentCheckerOptions extends ValidatorBuilderOptions {
		readonly onExtraArguments: "validation_error" | "allow_anything"
	}

	function getFullArgCheckerOpts(opts?: Partial<FunctionArgumentCheckerOptions>): FunctionArgumentCheckerOptions {
		return {
			onExtraArguments: "validation_error",
			...getFullValidatorBuilderOpts(opts)
		}
	}


	export interface SimpleTypeStringificationOptions {
		/** Use fullRefName instead of refName */
		fullNames: boolean
		/** Use names only for objects that have names */
		useLessName: boolean
	}

	export const simpleTypeToString: (type: SimpleType, params?: Partial<SimpleTypeStringificationOptions>) => string = TypeStringifier.simpleTypeToString

	function throwNoExecute(): never {
		throw new Error("This function never meant to be actually executed! If you see this error, that means you broke the code (for example, passed this function around instead of just calling it), or never set up the transformer in the first place.")
	}

	/** Get description for type T
	 * This function is never actually called; instead, it transformed to fetch type by name */
	export function getType<T>(): Type & RUNTYPER_THIS_IS_MARKER_INTERFACE_FOR_TYPE_INSTANCE {
		throwNoExecute() as unknown as T // cast is just to get rid of unused notice
		return null as unknown as Type
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	interface RUNTYPER_THIS_IS_MARKER_INTERFACE_FOR_TYPE_INSTANCE {
		// it is left blank intentionally, as it is indeed marker interface
	}

	/** Append custom validating function to a type
	 * Validating function should return `true` if validation is not passed, `false` if value is good
	 * Passing a generic argument to this function call is mandatory! A type will be resolved by the argument.
	 * Generic arguments of the type are discarded; that is, validator will be applied when checking value to match this type regardless of values of generic parameters */
	export function attachValidator<T>(validator: (value: T) => boolean): RUNTYPER_THIS_IS_MARKER_INTERFACE_FOR_ATTACH_VALIDATOR | void {
		void validator
		throwNoExecute()
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	interface RUNTYPER_THIS_IS_MARKER_INTERFACE_FOR_ATTACH_VALIDATOR {
		// nothing
	}

	/** Same as `attachValidator`, but does not discard generic arguments.
	 * For example, if you are attaching validator to Box<string>, it won't be applied when checking Box<number> */
	export function attachValidatorWithSpecificGenericParams<T>(validator: (value: T) => boolean): RUNTYPER_THIS_IS_MARKER_INTERFACE_FOR_ATTACH_VALIDATOR_GENERIC | void {
		void validator
		throwNoExecute()
	}
	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	interface RUNTYPER_THIS_IS_MARKER_INTERFACE_FOR_ATTACH_VALIDATOR_GENERIC {
		// nothing
	}

	/** Some internal functions.
	 * Calls to those functions appear in generated code. You should never invoke them manually. */
	export namespace internal {
		export function t(pairs: [name: string, value: Runtyper.Type][]): void {
			for(let [name, value] of pairs){
				runtime.refTypes.set(name, value)
			}
		}

		export function v(pairs: [name: string, value: Runtyper.Type][]): void {
			for(let [name, value] of pairs){
				runtime.valueTypes.set(name, value)
			}
		}

		export function f(pairs: [name: string, value: unknown][]): void {
			for(let [name, value] of pairs){
				if(typeof(value) === "function"){
					runtime.functionsByName.set(name, value as () => void)
					runtime.nameByFunctions.set(value as () => void, name)
				}
			}
		}

		export const attachValidator: unknown = runtime.attachValidator
	}

	let simplifier: TypeSimplifier | null = null
	export function getSimplifier(): TypeSimplifier {
		return simplifier ||= new TypeSimplifier()
	}

	let builders = {} as {[k: string]: ValidatorBuilder}
	export function getValidatorBuilder(opts?: Partial<ValidatorBuilderOptions>): ValidatorBuilder {
		let fullOpts = getFullValidatorBuilderOpts(opts)

		let key = Object.keys(fullOpts).sort()
			.map(key => fullOpts[key as keyof ValidatorBuilderOptions])
			.join("|")

		return builders[key] ||= new ValidatorBuilderImpl(fullOpts)
	}

	/** Having a function, make function that validates array of arguments
	 * If validation is not passed, the function will throw */
	export function getArrayParameterChecker(fn: () => void, opts?: Partial<FunctionArgumentCheckerOptions>): (args: unknown[]) => void {
		return new FunctionArgumentChecker(getFullArgCheckerOpts(opts)).buildForArray(fn)
	}

	/** Having a function, make function that validates object-map of arguments and lay them in order of appearance
	 * If validation not passed, the function will throw
	 * Resulting array of values may be used to call source function: `fn(...values)` */
	export function getObjectParameterChecker(fn: () => void, opts?: Partial<FunctionArgumentCheckerOptions>): (args: {readonly [k: string]: unknown}) => unknown[] {
		return new FunctionArgumentChecker(getFullArgCheckerOpts(opts)).buildForObject(fn)
	}

	/** Having a class constructor, get all public methods in the class, and possibly in parent classes */
	// eslint-disable-next-line @typescript-eslint/ban-types
	export const getPublicMethodsOfClass: (cls: Function, includeParentClasses?: boolean) => Record<string, Function> = runtime.getPublicMethodsOfClass

	export class ValidationError extends Error {
		public readonly badValue: unknown
		public readonly valuePath: readonly (string | number)[]
		public readonly validatingExpression: string
		public readonly sourceValue: unknown

		constructor(badValue: unknown,
			valuePath: readonly (string | number)[],
			validatingExpression: string,
			sourceValue: unknown,
			rootValueName = "value") {

			let pathStr = rootValueName + valuePath
				.map(x => typeof(x) === "number"
					? "[" + x + "]"
					: x.match(/^[a-zA-Z_][a-zA-Z\\d_]*$/)
						? "." + x
						: "[" + JSON.stringify(x) + "]")
				.join("")
			super("Validation failed: bad value at path " + pathStr + " (of type " + typeof(badValue) + "): failed at expression " + validatingExpression)
			this.badValue = badValue
			this.valuePath = valuePath
			this.validatingExpression = validatingExpression
			this.sourceValue = sourceValue
		}

		withDifferentValueName(name: string): ValidationError {
			return new ValidationError(
				this.badValue,
				this.valuePath,
				this.validatingExpression,
				this.sourceValue,
				name
			)
		}
	}

	/** Erase all of type structure data this code holds in memory
	 * After this, most of actions related to validator building will be unavailable
	 * You should do this after building all of validators you need, as this data may hold references to some values that otherwise may be collected by GC */
	export function cleanup(): void {
		simplifier = null
		builders = {}
		runtime.cleanupAllMaps()
	}

}

/** A part of namespace dedicated to types */
export namespace Runtyper {

	/** Any type structure this validator can represent.
	 * Is very close to the original code structure. */
	export type Type = PrimitiveType
	| IntersectionType
	| UnionType
	| ConstantType
	| ConstantUnionType
	| NonNullExpressionType
	| ReferenceType
	| CallResultReferenceType
	| ArrayType
	| TupleType
	| ObjectType
	| GenericParameterType
	| KeyofType
	| MappedType
	| IndexAccessType
	| ConditionalType
	| Runtyper.FunctionDeclaration
	| Runtyper.ClassDeclaration
	| InterfaceDeclaration
	| AliasDeclaration
	| EnumDeclaration
	| BrokenType

	/** Simplified type information.
	 * All references, generics, declarations, smart conditions and operations etc are resolved.
	 * Watch out for recursive references. */
	export type SimpleType = (PrimitiveType
	| UnionType<SimpleType>
	| IntersectionType<SimpleType>
	| ConstantType
	| ConstantUnionType
	| ArrayType<SimpleType>
	| SimpleTupleType<SimpleType>
	| SimpleObjectType<SimpleType>
	| ClassInstanceType
	) & RefInfo

	/** Additional information about origin of the type */
	export interface RefInfo {
		/** If the type is product of type/value reference, then this field will be filled with the full reference name
		 * Makes generated code more readable */
		readonly refName?: string
		/** Same as refName, just with more info.
		   * Thought to be unique (two types with same fullRefName should be actually the same) */
		readonly fullRefName?: string
		/** Validators that were attached to this type before simplification */
		readonly validators?: ((value: unknown) => boolean)[]
	}

	export interface ClassDeclaration {
		readonly type: "class"
		// everything from `extends` and `implements`
		readonly heritage?: Type[]
		readonly methods?: {readonly [propertyName: string]: Method}
		readonly staticProperties?: {readonly [propertyName: string]: StaticProperty}
		readonly instanceProperties?: {readonly [propertyName: string]: InstanceProperty}
		readonly typeParameters?: TypeParameter[]
	}

	export type AccessLevel = "private" | "public" | "protected"

	export type InstanceProperty = ObjectPropertyType & {readonly access: AccessLevel}

	export interface StaticProperty {
		// static properties are essentialy just variables
		// we store types of variables in separate map, and this set contains keys of this map
		readonly name: string
		readonly access: AccessLevel
	}

	export interface Method {
		readonly optional?: true
		// methods don't store most of type information
		// the type information is stored in separate map
		// so in this property contains the key from this map
		readonly functionName: string
		readonly access: AccessLevel
	}

	export interface FunctionDeclaration {
		readonly type: "function"
		readonly signatures: readonly CallSignature[]
	}

	export interface CallSignature {
		readonly parameters?: FunctionParameter[]
		readonly returnType: Type
		readonly typeParameters?: TypeParameter[]
		// functions either have multiple overloads, and then one with implementation does not count in validation
		// or does not have overloads, and then you should use the only overload to validate
		// this property only means something of there is more than one signature
		// in case there is only one, you should not rely on it
		// (like, `let f: (x: number) => void = x => console.log(x)` won't be considered having implementation)
		readonly hasImplementation?: boolean
	}

	export interface FunctionParameter {
		// name can be absent if the parameter is destructurized in declaration
		// like, `function({a, b}: {a: number, b: string})`
		// the function has 1 parameter, and this parameter has no clear name
		readonly name?: string
		readonly valueType: Type
		readonly optional?: true
		readonly rest?: true
	}

	export interface PrimitiveType {
		readonly type: "string" | "number" | "boolean" | "any" | "unknown" | "never"
	}

	export interface UnionType<T = Type> {
		readonly type: "union"
		readonly types: readonly T[]
	}

	export interface IntersectionType<T = Type> {
		readonly type: "intersection"
		readonly types: readonly T[]
	}

	export interface ConstantType {
		readonly type: "constant"
		readonly value: string | number | boolean | null | undefined
	}

	/** A set of constant values. Value matches type if it equals any of the constant values
	 * Logically it's the same of several ConstantType in union
	 * Introduced to make checks more optimized, and also to reduce generated code size
	 * That is, it's very easy to produce large constant union types,
	 * but storing each of them as individual type is just bad */
	export interface ConstantUnionType<T = ConstantType["value"]> {
		readonly type: "constant_union"
		readonly value: readonly T[]
	}

	/** A reference for type that is not placed literally in the code, but instead placed as a name, definition of which resides somewhere else.
	 * This type should go away after call to finalize() */
	export interface ReferenceType {
		readonly type: "type_reference" | "value_reference"
		readonly name: string
		/** What types are passed as generic arguments to referenced type
		 * In case of value reference, it may be arguments passed to class type parameters */
		readonly typeArguments?: (Type | InferType)[]
	}

	export interface InferType {
		readonly type: "infer"
		readonly name: string
	}

	export interface CallResultReferenceType {
		readonly type: "call_result_reference"
		readonly functionName: string
	}

	export interface ArrayType<T = Type> {
		readonly type: "array"
		readonly valueType: T
	}

	/** Expression of type `let x = (a as number | null)!` */
	export interface NonNullExpressionType {
		readonly type: "non_null"
		readonly valueType: Type
	}

	export type ObjectIndexKeyBasicType = {type: "string" | "number"} | ConstantUnionType<number | string> | ConstantType
	export type ObjectIndexKeyType = ObjectIndexKeyBasicType | UnionType<ObjectIndexKeyBasicType>

	export type ObjectPropertyType = Type & {readonly optional?: true}
	export interface ObjectIndexType<T = Type> {
		readonly keyType: ObjectIndexKeyType
		readonly valueType: T
	}

	export interface SimpleObjectType<T = Type> {
		readonly type: "object"
		readonly properties: {readonly [propertyName: string]: T}
		readonly index?: ObjectIndexType<T>
	}

	export interface ObjectType extends SimpleObjectType {
		readonly properties: {readonly [propertyName: string]: ObjectPropertyType}
		// properties that are declared like `[constStringValue]: 12345`
		// they need separate key array, because we should never copy type of the key
		// (as it may be not in the same file)
		readonly propertyByConstKeys?: {readonly [valueName: string]: ObjectPropertyType}
	}

	export interface MappedType {
		readonly type: "mapped_type"
		readonly keyName: string
		readonly keyType: Type
		readonly valueType: Type
		readonly optional?: true
	}

	export interface IndexAccessType {
		readonly type: "index_access"
		readonly object: Type
		readonly index: Type
		/** Can be true if type is produced by variable destructurized like `let [...x] = [1,2,3]`
		 * Note that `object` type can be either tuple, array or object, and this calls for different approaches */
		readonly rest?: true
	}

	export type SimpleTupleElementType<T = Type> = (T | RestType<T>)
	export interface SimpleTupleType<T = Type>{
		readonly type: "tuple"
		// keep in mind `rest` parameter
		// best way to match value to this type descriptions is to approach rest from start,
		// then from the end, then try to match all values that left to the rest parameter type
		// I guess that's why typescript allows no more than rest parameter per tuple
		readonly valueTypes: readonly SimpleTupleElementType<T>[]
	}
	export type TupleElementType<T = Type> = ((T & {readonly optional?: true}) | RestType<T>)
	export interface TupleType<T = Type> extends SimpleTupleType<T> {
		readonly valueTypes: readonly TupleElementType<T>[]
	}

	// it's just for tuples. not included in general type description type
	export interface RestType<T = Type> {
		readonly type: "rest"
		readonly valueType: T
	}

	export interface GenericParameterType {
		readonly type: "generic_parameter"
		readonly name: string
	}

	export interface KeyofType {
		readonly type: "keyof"
		readonly target: Type
	}

	export interface ConditionalType {
		// when processing, remember the difference in behavior for union and non-union types
		// also don't forget about infer
		readonly type: "conditional"
		readonly checkType: Runtyper.Type // A in expression like `A extends B`
		readonly extendsType: Runtyper.Type // B in expression like `A extends B`
		readonly trueType: Runtyper.Type
		readonly falseType: Runtyper.Type
	}

	export interface InterfaceDeclaration extends Omit<ObjectType, "type"> {
		readonly type: "interface"
		readonly heritage?: Type[]
		readonly typeParameters?: TypeParameter[]
	}

	export interface AliasDeclaration {
		readonly type: "alias"
		readonly body: Type
		readonly typeParameters?: TypeParameter[]
	}

	export interface TypeParameter {
		readonly name: string
		readonly default?: Type
	}

	export interface EnumDeclaration {
		readonly type: "enum"
		readonly values: (number | string)[]
	}

	export interface ClassInstanceType {
		readonly type: "instance"
		// eslint-disable-next-line @typescript-eslint/ban-types
		readonly cls: Function
	}

	/** This is one way of reporting errors from transformer
	 * Thing is, there are a lot of ways to use Typescript, and some of them is painful to support in transformer
	 * Therefore, transformer cannot process some types, and has to return error
	 * There is two ways of returning error: just throw, or yield broken type
	 * Runtime functions are expected to throw if they discover broken type
	 * That way some of broken types won't result in a throw, because they will never be discovered by runtime functions */
	export interface BrokenType {
		readonly type: "broken"
		readonly file: string
		readonly node: string
		readonly message: string
	}

}

export default ToolboxTransformer.makeImplodableTransformer<Runtyper.TransformerParameters>(opts => {
	// Error.stackTraceLimit = 100
	let params: Runtyper.TransformerParameters = {
		moduleName: "@nartallax/runtyper",
		moduleIdentifier: "__RuntyperAutogeneratedImport",
		includeExternalTypesFrom: [],
		...opts.params
	}

	let transParams: TransParams = {
		...params,
		allowedExtPacks: new Set(params.includeExternalTypesFrom)
	}

	let ambientCache = new AmbientModuleCache(opts.program.getTypeChecker())

	return transformContext => {
		let tricks = new RuntyperTricks(opts, transformContext, Tsc, ambientCache)
		return sourceFile => new Transformer(tricks, transParams).transform(sourceFile)
	}
})