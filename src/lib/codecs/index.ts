// Hot codecs: light WASM kept in the main bundle.
import { registerCodec, registerStaticCodec } from './registry';
import { jpegCodec } from './jpeg';
import { webpCodec } from './webp';
import { pngCodec } from './png';

registerStaticCodec(jpegCodec);
registerStaticCodec(webpCodec);
registerStaticCodec(pngCodec);

// Cold codecs: heavy WASM loaded on demand (dynamic import → separate chunks).
registerCodec('avif', () => import('./avif').then((m) => m.avifCodec));
registerCodec('jxl', () => import('./jxl').then((m) => m.jxlCodec));

export { getCodec, listCodecs, codecIdFromMime } from './registry';
export type { Codec, CodecCapabilities, EncodeOptions, RGBA } from './types';
