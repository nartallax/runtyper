import {ToolboxTransformer} from "@nartallax/toolbox-transformer"
import * as runtime from "runtime"
import * as Tsc from "typescript"
import {TopLevelTransformer, TransParams} from "transformer/toplevel_transformer"
import {RuntyperTricks} from "transformer/tricks"
import {SecondaryProgram} from "transformer/secondary_program"

export namespace Runtyper {

	/** Parameters that transformer take through tsconfig.json
	 * All of these options have defaults, so you may define them only if you really need to */
	export interface TransformerParameters {
		/** Name of the transformer module.
		 * This name will be inserted in generated code when the code needs to refer to this module. */
		moduleName: string
		/** An identifier that will be used in generated code to refer to this module when imported */
		moduleIdentifier: string
		/** What action will compiler do upon discovering an error
		 * See comment to IllegalType for context */
		onTransformerTypeError: "throw" | "illegal_type"
		/** A set of npm package names. If your code references type from one of these packages, copy of the type structure will be included in place where it is referenced.
		 * This list always includes "typescript", as you kinda always have to use it (all of these Omit, Record and so on)
		 * (also that means that you won't be able to add validators to types from those packages) */
		// literallyReferencablePackages: string[]
		/** A set of npm package names. If your code references type from one of these packages, reference to the type will be included in place where it is referenced.
		 * This means that you are certain that this other package also uses Runtyper to describe its types.
		 * (also that means that any validators the package put on the referenced type will also become a part of your validators) */
		// referenciallyReferencablePackages: string[]
	}

	export interface CallSignature {
		readonly type: "call_signature"
		readonly parameters?: Parameter[]
		readonly returnType: Type
		readonly typeParameters?: TypeParameter[]
	}

	export interface Parameter {
		readonly type: "parameter"
		// name can be absent if the parameter is destructurized in declaration
		// like, `function({a, b}: {a: number, b: string})`
		// the function has 1 parameter, and this parameter has no clear name
		readonly name?: string
		readonly valueType: Type
		readonly optional?: true
	}

	export interface Class {
		readonly type: "class"
		// everything from `extends` and `implements`
		readonly heritage?: Type[]
		readonly methods?: ReadonlyMap<string, Method>
		readonly staticProperties?: ReadonlyMap<string, StaticProperty>
		readonly instanceProperties?: ReadonlyMap<string, InstanceProperty>
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
		readonly type: "method"
		readonly optional?: true
		// methods don't store most of type information
		// the type information is stored in separate map
		// so in this property contains the key from this map
		readonly functionName: string
		readonly access: AccessLevel
	}

	export type FunctionOverload = (CallSignature & {
		// functions either have multiple overloads, and then one with implementation does not count in validation
		// or does not have overloads, and then you should use the only overload to validate
		readonly hasImplementation?: boolean
	})

	export interface Function {
		readonly type: "function"
		readonly signatures: readonly FunctionOverload[]
	}

	export type Type = PlainType
	| CompositeType
	| ConstantType
	| ConstantUnionType
	| ReferenceType
	| ArrayType
	| ObjectType
	| TupleType
	| GenericParameterType
	| KeyofType
	| TypeExpression
	| IllegalType
	| MappedType
	| IndexAccessType
	| TypeofType
	| ValueReferenceType
	| NeverType
	| ConditionalType
	| CallSignature
	| Runtyper.Function
	| Runtyper.Class

	export type TypeDeclaration = InterfaceDeclaration | AliasDeclaration | EnumDeclaration | IllegalType

	export interface PlainType {
		readonly type: "string" | "number" | "boolean" | "any" | "unknown"
	}

	export interface CompositeType {
		readonly type: "union" | "intersection"
		readonly types: readonly Type[]
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
	export interface ConstantUnionType {
		readonly type: "constant_union"
		readonly value: ReadonlySet<ConstantType["value"]>
	}

	/** A reference for type that is not placed literally in the code, but instead placed as a name, definition of which resides somewhere else.
	 * This type should go away after call to finalize() */
	export interface ReferenceType {
		readonly type: "reference"
		readonly name: string
		/** What types are passed as generic arguments to referenced type */
		readonly typeArguments?: (Type | InferType)[]
	}

	export interface InferType {
		readonly type: "infer"
		readonly name: string
	}

	/** A reference to type of some value.
	 * For example, typeof x (where x is variable) can create such reference. */
	export interface ValueReferenceType {
		readonly type: "value_reference"
		readonly name: string
	}

	export interface ArrayType {
		readonly type: "array"
		readonly valueType: Type
	}

	export type ObjectPropertyType = Type & {readonly optional?: true}
	export interface ObjectIndexType {
		readonly keyType: Type
		readonly valueType: Type
	}
	export interface ObjectType {
		readonly type: "object"
		readonly properties: {readonly [propertyName: string]: ObjectPropertyType}
		// properties that are declared like `[constStringValue]: 12345`
		// they need separate key array, because we should never copy type of the key
		// (as it may be not in the same file)
		readonly propertyByConstKeys?: {readonly [valueName: string]: ObjectPropertyType}
		readonly index?: ObjectIndexType
		// TODO: when validating, die on presence of callsignature
		readonly callSignatures?: CallSignature[]
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

	export type TupleElementType = ((Type & {readonly optional?: true}) | RestType | IllegalType)
	export interface TupleType {
		readonly type: "tuple"
		// keep in mind `rest` parameter
		// best way to match value to this type descriptions is to approach rest from start,
		// then from the end, then try to match all values that left to the rest parameter type
		// I guess that's why typescript allows no more than rest parameter per tuple
		readonly valueTypes: readonly TupleElementType[]
	}

	// it's just for tuples. not included in general type description type
	export interface RestType {
		readonly type: "rest"
		readonly valueType: Type
	}

	export interface GenericParameterType {
		readonly type: "generic_parameter"
		readonly name: string
	}

	export interface KeyofType {
		readonly type: "keyof"
		readonly target: Type
	}

	export interface TypeofType {
		readonly type: "typeof"
		readonly valueName: string
	}

	export interface NeverType {
		readonly type: "never"
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
		readonly extends?: Type[]
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

	export interface TypeExpression {
		readonly type: "type_expression"
		readonly typeParameters: TypeParameter[]
		readonly body: Type
	}

	export interface EnumDeclaration {
		readonly type: "enum"
		readonly values: ReadonlySet<number | string>
	}

	/** This is one way of reporting errors from transformer
	 * Thing is, there are a lot of ways to use Typescript, and some of them is painful to support in transformer
	 * Therefore, transformer cannot process some types, and has to return error
	 * There is two ways of returning error: just throw, or yield illegal type
	 * Runtime functions are expected to throw if they discover illegal type
	 * That way some of illegal types won't result in a throw, because they will never be discovered by runtime functions */
	export interface IllegalType {
		readonly type: "illegal"
		readonly file: string
		readonly node: string
		readonly message: string
	}


	/** Get description for type T
	 * This function is never actually called; instead, it transformed to fetch type by name
	 * T is referenced in return type just to make it "used" */
	export function getType<T>(): Type & (RUNTYPER_THIS_IS_MARKER_INTERFACE_FOR_TYPE_INSTANCE | T) {
		throw new Error("This function never meant to be actually executed! If you see this error, that means you broke the code (for example, passed this function around instead of just calling it), or never set up the transformer in the first place.")
	}

	/** Build a function that will verify that value matches the type description.
	 * Validator will throw error on first mismatch.
	 * Building validators is kinda expensive, so don't do it for every method */
	// export const buildValidator = runtime.buildValidator
	/** Attaches a validator to a type. Validator expected to throw detailed message if anything goes wrong.
	 * When any kind of validator is built and this type is discovered, call to this validator will be issued. */
	// export const attachValidator = runtime.attachValidator

	/** Call to this function will indicate no more types are gonna be defined.
	 * This call will resolve reference functions and check type system for consistency. */
	// export const finalize = runtime.finalize

	/** Type information about interfaces and type aliases */
	export const refTypes: ReadonlyMap<string, TypeDeclaration> = runtime.refTypes
	export const functionsByName: ReadonlyMap<string, () => void> = runtime.functionsByName
	/** Type information about variables, constants, classes and their methods (outside of the functions) */
	export const valueTypes: ReadonlyMap<string, Type> = runtime.valueTypes

	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	interface RUNTYPER_THIS_IS_MARKER_INTERFACE_FOR_TYPE_INSTANCE {
		// it is left blank intentionally, as it is indeed marker interface
	}

}

export default ToolboxTransformer.makeImplodableTransformer<Runtyper.TransformerParameters>(opts => {
	Error.stackTraceLimit = 100
	let params: Runtyper.TransformerParameters = {
		moduleName: "@nartallax/runtyper",
		moduleIdentifier: "__RuntyperAutogeneratedImport",
		onTransformerTypeError: "illegal_type",
		// literallyReferencablePackages: [],
		// referenciallyReferencablePackages: [],
		...opts.params
	}
	// params.literallyReferencablePackages.push("typescript")
	let secondaryProgram: SecondaryProgram | null = null

	return transformContext => {
		let tricks = new RuntyperTricks(opts, transformContext, Tsc)
		let transParams: TransParams = {
			...params
			// litRefPacks: new Set(params.literallyReferencablePackages),
			// refRefPacks: new Set(params.referenciallyReferencablePackages)
		}
		let transformer = new TopLevelTransformer(
			tricks,
			transParams,
			secondaryProgram ||= new SecondaryProgram(opts.tsconfigPath)
		)
		return sourceFile => {
			let result = transformer.transform(sourceFile)
			return result
		}
	}
})