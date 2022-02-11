import {NestedA} from "./namespaces"
import * as SimpleModule from "../types/simple"

export type TTTTTT = typeof SimpleModule.typePointToBeRequiredExternally
export type ZZZZZZ = typeof NestedA.NestedB.NestedC.NestedD.veryNestedFn

export const otherConstBasedOnAnotherConst = {...SimpleModule.typePointToBeRequiredExternally}