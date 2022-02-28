/** String builder that fixes identation automatically
 * Not very smart in that regard */
export class CodeBuilder {

	private result = ""
	private identLevel = 0

	getResult(): string {
		return this.result
	}

	append(part: string): void {
		part = this.updateIdent(part)
		this.result += part
	}

	private updateIdent(part: string): string {
		let lines = part.split("\n")
		for(let i = 0; i < lines.length; i++){
			let line = lines[i]!.trim()
			if(line.startsWith("}")){
				this.identLevel--
			}
			line = new Array(this.identLevel + 1).join("\t") + line
			if(line.endsWith("{")){
				this.identLevel++
			}
			lines[i] = line
		}
		return lines.join("\n")
	}

}