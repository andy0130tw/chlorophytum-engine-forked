import {
	IFinalHintFormat,
	IFinalHintSink,
	IFontConnection,
	IFontFormat,
	Plugins
} from "@chlorophytum/arch";
import {
	CHlttFinalHintFormat,
	HlttCollector,
	HlttFinalHintFormatOptions
} from "@chlorophytum/final-hint-format-hltt";

import { TtfFontLoader } from "./plugin-impl/font-loader";
import { TtfInstrIntegrator } from "./plugin-impl/instruction-integrator";
import { TtfPreStatAnalyzer } from "./plugin-impl/pre-stat";

export interface IFileSystemProvider {
	readFile(path: string): Promise<Buffer>;
	writeFile(path: string, content: Buffer): Promise<void>;
}

class TtfFontFormat implements IFontFormat {
	constructor(
		private readonly options: HlttFinalHintFormatOptions,
		private readonly fs?: IFileSystemProvider
	) {}
	public async getFinalHintFormat(): Promise<IFinalHintFormat> {
		return new CHlttFinalHintFormat(this.options);
	}
	public async connectFont(path: string, identifier: string) {
		return await TtfFontConnection.create(path, identifier, this.fs);
	}
}

class TtfFontConnection implements IFontConnection {
	constructor(
		private readonly path: string,
		private readonly identifier: string,
		private readonly fs: IFileSystemProvider
	) {}

	public async openFontSource() {
		return await new TtfFontLoader(this.path, this.identifier, this.fs).load();
	}

	public async openPreStat(sink: IFinalHintSink) {
		const hlttSink = sink.dynamicCast(HlttCollector);
		if (hlttSink) return new TtfPreStatAnalyzer(this.path, hlttSink, this.fs);
		else return null;
	}

	public async openFinalHintIntegrator() {
		return new TtfInstrIntegrator(this.path, this.fs);
	}

	static async create(path: string, identifier: string, maybeFs?: IFileSystemProvider) {
		const fs = maybeFs ?? (await import("node:fs/promises"));
		return new TtfFontConnection(path, identifier, fs);
	}
}

export const FontFormatPlugin: Plugins.IFontFormatPlugin = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	load: async (loader: Plugins.IAsyncModuleLoader, parameters: any, fs?: IFileSystemProvider) =>
		new TtfFontFormat(CHlttFinalHintFormat.rectifyOptions(parameters), fs)
};

export { GlyphSetWrapper } from "./support/otb-support";
