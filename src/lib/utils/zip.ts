import { zipSync } from 'fflate';

export interface ZipEntry {
	name: string;
	blob: Blob;
}

const stripUnsafe = (name: string): string =>
	name.replaceAll('\\', '_').replaceAll('/', '_').slice(0, 120);

/** Noms uniques : 'a.jpg', 'a (2).jpg', 'a (3).jpg'… */
function uniqueName(name: string, seen: Map<string, number>): string {
	const count = seen.get(name) ?? 0;
	seen.set(name, count + 1);
	if (count === 0) return name;
	const dot = name.lastIndexOf('.');
	const base = dot > 0 ? name.slice(0, dot) : name;
	const ext = dot > 0 ? name.slice(dot) : '';
	return `${base} (${count + 1})${ext}`;
}

export async function buildZip(entries: ZipEntry[]): Promise<Blob> {
	const files: Record<string, Uint8Array> = {};
	const seen = new Map<string, number>();
	for (const entry of entries) {
		const name = uniqueName(stripUnsafe(entry.name), seen);
		files[name] = new Uint8Array(await entry.blob.arrayBuffer());
	}
	return new Blob([zipSync(files, { level: 6 })], { type: 'application/zip' });
}