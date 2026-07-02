import * as stream from "stream";

import {
	BuiltInCombinators,
	IHint,
	IHintingPass,
	IHintStore,
	IHintStoreProvider
} from "@chlorophytum/arch";
import { MemoryHintStore } from "@chlorophytum/hint-store-memory";
import { StreamJsonZip } from "@chlorophytum/util-json";

import { IStreamProvider, IWritableStreamProvider } from ".";

async function createNodeStreamProvider() {
	const fs = await import("node:fs");
	return {
		async createReadStream(path: string) {
			return fs.createReadStream(path);
		},
		async createWriteStream(path: string) {
			return fs.createWriteStream(path);
		}
	};
}

export class HintStoreFsProvider implements IHintStoreProvider {
	constructor(private readonly sp: IStreamProvider) {}
	public async connectRead(path: string, pass: IHintingPass) {
		const hs = new FsHintStore(path, this.sp);
		await new OtdHsSupport().populateHintStore(await this.sp.createReadStream(path), pass, hs);
		return hs;
	}
	public async connectWrite(path: string, pass: IHintingPass) {
		return new FsHintStore(path, this.sp);
	}

	static async create(sp?: IStreamProvider) {
		return new HintStoreFsProvider(sp ?? (await createNodeStreamProvider()));
	}
}

class FsHintStore extends MemoryHintStore {
	constructor(
		private saveTo: string,
		private readonly wsp: IWritableStreamProvider
	) {
		super();
	}
	public async commitChanges() {
		const output = await this.wsp.createWriteStream(this.saveTo);
		await new OtdHsSupport().saveHintStore(this, output);
	}
}

class OtdHsSupport {
	private hintMapToDict(map: Map<string, IHint>) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const dict: { [key: string]: any } = Object.create(null);
		for (const [k, v] of map) {
			dict[k] = v.toJSON();
		}
		return dict;
	}
	private stringMapToDict(map: Map<string, string>) {
		const dict: { [key: string]: string } = Object.create(null);
		for (const [k, v] of map) {
			dict[k] = v;
		}
		return dict;
	}

	public saveHintStore(hs: MemoryHintStore, output: stream.Writable) {
		const obj = {
			glyphs: this.hintMapToDict(hs.glyphHints),
			glyphHintCacheKeys: this.stringMapToDict(hs.glyphHintCacheKeys),
			sharedHints: this.hintMapToDict(hs.sharedHints)
		};
		return StreamJsonZip.stringify(obj, output);
	}

	public async populateHintStore(input: stream.Readable, pass: IHintingPass, store: IHintStore) {
		const hsRep = await StreamJsonZip.parse(input);

		const hf = new BuiltInCombinators.FallbackHintFactory(pass.factoriesOfUsedHints);
		for (const k in hsRep.glyphs) {
			const hint = hf.readJson(hsRep.glyphs[k], hf);
			if (hint) await store.setGlyphHints(k, hint);
		}
		for (const k in hsRep.sharedHints) {
			const hint = hf.readJson(hsRep.sharedHints[k], hf);
			if (hint) await store.setSharedHints(k, hint);
		}
		for (const k in hsRep.glyphHintCacheKeys) {
			await store.setGlyphHintsCacheKey(k, hsRep.glyphHintCacheKeys[k]);
		}
	}
}
