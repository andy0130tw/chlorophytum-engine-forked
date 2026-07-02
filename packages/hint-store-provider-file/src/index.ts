import * as stream from "stream";

import { Plugins } from "@chlorophytum/arch";

import { HintStoreFsProvider } from "./provider";

export interface IReadableStreamProvider {
	createReadStream(path: string): Promise<stream.Readable>;
}

export interface IWritableStreamProvider {
	createWriteStream(path: string): Promise<stream.Writable>;
}

export interface IStreamProvider extends IReadableStreamProvider, IWritableStreamProvider {}

export const HintStoreProviderPlugin: Plugins.IHintStoreProviderPlugin = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	load: async (loader: Plugins.IAsyncModuleLoader, parameters: any, sp?: IStreamProvider) =>
		await HintStoreFsProvider.create(sp)
};
