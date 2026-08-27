import type { RGBA } from './types';

export function createImageData(rgba: RGBA): ImageData {
	const data = rgba.data; // Uint8ClampedArray is what ImageData expects
	return new ImageData(data, rgba.width, rgba.height);
}

export function fromImageData(imageData: ImageData): RGBA {
	return {
		width: imageData.width,
		height: imageData.height,
		data: imageData.data
	};
}

export function arrayBufferToBlob(buffer: ArrayBuffer, mime: string): Blob {
	return new Blob([buffer], { type: mime });
}