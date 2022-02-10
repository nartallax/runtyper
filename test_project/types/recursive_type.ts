export interface TreeNode<T>{
	value: T
	left?: TreeNode<T>
	right: TreeNode<T> | null
}

export type Div = {child?: Div | Img, text: string}
export type Img = {child?: Div | Img, src: string}