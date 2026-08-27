import type { Codec } from './types';

type CodecLoader = () => Promise<{ default: Codec } | Codec>;

const entries = new Map<string, CodecLoader>();
const cache = new Map<string, Codec>();

export function registerStaticCodec(codec: Codec): void {
	entries.set(codec.id, async () => codec);
	cache.set(codec.id, codec);
}

export function registerCodec(id: string, loader: CodecLoader): void {
	entries.set(id, loader);
}

export async function getCodec(id: string): Promise<Codec | undefined> {
	const hit = cache.get(id);
	if (hit) return hit;
	const loader = entries.get(id);
	if (!loader) return undefined;
	const mod = await loader();
	const codec = 'default' in mod ? mod.default : mod;
	cache.set(id, codec);
	return codec;
}

export async function listCodecs(): Promise<Codec[]> {
	const ids = [...entries.keys()];
	const codecs = await Promise.all(ids.map((id) => getCodec(id)));
	return codecs.filter((c): c is Codec => Boolean(c));
}

const MIME_TO_ID: Record<string, string> = {
	'image/jpeg': 'jpeg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/avif': 'avif',
	'image/jxl': 'jxl'
};

export function codecIdFromMime(mime: string): string | undefined {
	return MIME_TO_ID[mime];
}
