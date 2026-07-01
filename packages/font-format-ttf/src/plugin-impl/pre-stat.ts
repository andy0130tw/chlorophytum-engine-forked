import { IFinalHintPreStatAnalyzer } from "@chlorophytum/arch";
import { HlttCollector } from "@chlorophytum/final-hint-format-hltt";
import { FontIo, Ot } from "ot-builder";

import { IFileSystemProvider } from "..";

export class TtfPreStatAnalyzer implements IFinalHintPreStatAnalyzer {
	constructor(
		private readonly path: string,
		private readonly sink: HlttCollector,
		private readonly fs: IFileSystemProvider
	) {}
	public async preStat() {
		const sfnt = FontIo.readSfntOtf(await this.fs.readFile(this.path));
		const otd = FontIo.readFont(sfnt, Ot.ListGlyphStoreFactory);
		if (!Ot.Font.isTtf(otd)) return;
		this.sink.preStatSink.maxFunctionDefs = Math.max(
			this.sink.preStatSink.maxFunctionDefs,
			otd.maxp.maxFunctionDefs || 0
		);
		this.sink.preStatSink.maxTwilightPoints = Math.max(
			this.sink.preStatSink.maxTwilightPoints,
			otd.maxp.maxTwilightPoints || 0
		);
		this.sink.preStatSink.maxStorage = Math.max(
			this.sink.preStatSink.maxStorage,
			otd.maxp.maxStorage || 0
		);
		this.sink.preStatSink.maxStack = Math.max(
			this.sink.preStatSink.maxStack,
			otd.maxp.maxStackElements || 0
		);
		this.sink.preStatSink.cvtSize = Math.max(
			this.sink.preStatSink.cvtSize,
			otd.cvt ? otd.cvt.items.length : 0
		);
		this.sink.preStatSink.varDimensionCount = otd.fvar ? otd.fvar.axes.length : 0;
	}
}
