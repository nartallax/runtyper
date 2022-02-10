import {MyNumber, MyString as MS, SimpleNS, SimpleNS2 as SNS} from "types/simple"

export type MyStringNumber = MyNumber | MS
export type MyMyMy = SimpleNS.MyMy | "moo-moo"
export type Awoo2 = SNS.Awoo | "me"