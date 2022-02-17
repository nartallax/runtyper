export interface TreeNode<T>{
	value: T
	left?: TreeNode<T>
	right: TreeNode<T> | null
}

export type Div = {child?: Div | Img, text: string}
export type Img = {child?: Div | Img, src: string}

// export type Div2 = (Div2 & {str: string}) | string
export type Div3 = {child?: {[k in keyof Div3]: string}, offset: number}

export type Img4 = {next: Div4}
export type Div4 = {next: Img4}

interface LinkNodeOf<ChildNode> {
	next: ChildNode
}

export type LinkChain = LinkNodeOf<LinkNodeOf<LinkNodeOf<string>>>

export type Printer<T> = {printedValue: T}
export type DivPrinter = Printer<Div>