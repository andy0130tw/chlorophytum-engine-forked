import { FontIo, Ot } from "ot-builder";

import { IFileSystemProvider } from "..";
import { OtbFontSource } from "../support/otb-support";

export class TtfFontLoader {
	constructor(
		private readonly path: string,
		private readonly identifier: string,
		private readonly fs?: IFileSystemProvider
	) {}
	public async load() {
		const fs = this.fs ?? (await import("node:fs/promises"));
		const sfnt = FontIo.readSfntOtf(await fs.readFile(this.path));
		const ttf = FontIo.readFont(sfnt, Ot.ListGlyphStoreFactory);
		return new OtbFontSource(ttf, this.identifier);
	}
}
