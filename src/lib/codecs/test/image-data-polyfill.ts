// ImageData does not exist in Node; jsquash encoders only read .data/.width/.height.
export function installImageDataPolyfill(): void {
	if (typeof globalThis.ImageData === 'undefined') {
		// @ts-expect-error minimal test polyfill
		globalThis.ImageData = class ImageData {
			data: Uint8ClampedArray;
			width: number;
			height: number;
			constructor(data: Uint8ClampedArray, width: number, height: number) {
				this.data = data;
				this.width = width;
				this.height = height;
			}
		};
	}
}
