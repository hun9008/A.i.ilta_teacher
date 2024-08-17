export default function preprocessImage(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D context');
  }

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  blurARGB(image.data, canvas, 1);
  dilate(image.data, canvas);
  invertColors(image.data);
  thresholdFilter(image.data, 0.4);

  // Update the canvas with the processed image
  ctx.putImageData(image, 0, 0);

  // Return the processed image as a data URL
  return canvas.toDataURL('image/jpeg');
}

export function preprocessImageForThreshold(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D context');
  }

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  thresholdFilter(image.data, 0.5);

  // Update the canvas with the processed image
  ctx.putImageData(image, 0, 0);

  // Return the processed image as a data URL
  return canvas.toDataURL('image/jpeg');
}

function thresholdFilter(pixels: Uint8ClampedArray, level: number = 0.5): void {
  const thresh = Math.floor(level * 255);
  for (let i = 0; i < pixels.length; i += 4) {
    const red = pixels[i];
    const green = pixels[i + 1];
    const blue = pixels[i + 2];
    const gray = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    const value = gray >= thresh ? 255 : 0;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
  }
}

function getARGB(data: Uint8ClampedArray, i: number): number {
  const offset = i * 4;
  return (
    ((data[offset + 3] << 24) & 0xff000000) |
    ((data[offset] << 16) & 0x00ff0000) |
    ((data[offset + 1] << 8) & 0x0000ff00) |
    (data[offset + 2] & 0x000000ff)
  );
}

function setPixels(pixels: Uint8ClampedArray, data: Int32Array): void {
  let offset = 0;
  for (let i = 0; i < data.length; i++) {
    offset = i * 4;
    pixels[offset] = (data[i] & 0x00ff0000) >>> 16;
    pixels[offset + 1] = (data[i] & 0x0000ff00) >>> 8;
    pixels[offset + 2] = data[i] & 0x000000ff;
    pixels[offset + 3] = (data[i] & 0xff000000) >>> 24;
  }
}

let blurRadius: number;
let blurKernelSize: number;
let blurKernel: Int32Array;
let blurMult: Int32Array[];

function buildBlurKernel(r: number): void {
  let radius = Math.max(1, Math.min(248, (r * 3.5) | 0));

  if (blurRadius !== radius) {
    blurRadius = radius;
    blurKernelSize = (1 + blurRadius) << 1;
    blurKernel = new Int32Array(blurKernelSize);
    blurMult = new Array(blurKernelSize);
    for (let l = 0; l < blurKernelSize; l++) {
      blurMult[l] = new Int32Array(256);
    }

    for (let i = 1, radiusi = radius - 1; i < radius; i++) {
      const bki = radiusi * radiusi;
      blurKernel[radius + i] = blurKernel[radiusi] = bki;
      const bm = blurMult[radius + i];
      const bmi = blurMult[radiusi--];
      for (let j = 0; j < 256; j++) {
        bm[j] = bmi[j] = bki * j;
      }
    }

    const bk = (blurKernel[radius] = radius * radius);
    const bm = blurMult[radius];

    for (let k = 0; k < 256; k++) {
      bm[k] = bk * k;
    }
  }
}

function blurARGB(
  pixels: Uint8ClampedArray,
  canvas: HTMLCanvasElement,
  radius: number
): void {
  const width = canvas.width;
  const height = canvas.height;
  const numPackedPixels = width * height;
  const argb = new Int32Array(numPackedPixels);
  for (let j = 0; j < numPackedPixels; j++) {
    argb[j] = getARGB(pixels, j);
  }

  const a2 = new Int32Array(numPackedPixels);
  const r2 = new Int32Array(numPackedPixels);
  const g2 = new Int32Array(numPackedPixels);
  const b2 = new Int32Array(numPackedPixels);

  buildBlurKernel(radius);

  let yi = 0;
  let ym = -blurRadius;
  let ymi = ym * width;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let cb = 0,
        cg = 0,
        cr = 0,
        ca = 0,
        sum = 0;
      let read = x - blurRadius;
      let bk0 = 0;

      if (read < 0) {
        bk0 = -read;
        read = 0;
      }

      for (let i = bk0; i < blurKernelSize; i++) {
        if (read >= width) break;
        const c = argb[read + yi];
        const bm = blurMult[i];
        ca += bm[(c & -16777216) >>> 24];
        cr += bm[(c & 16711680) >> 16];
        cg += bm[(c & 65280) >> 8];
        cb += bm[c & 255];
        sum += blurKernel[i];
        read++;
      }

      const ri = yi + x;
      a2[ri] = ca / sum;
      r2[ri] = cr / sum;
      g2[ri] = cg / sum;
      b2[ri] = cb / sum;
    }
    yi += width;
  }

  yi = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let cb = 0,
        cg = 0,
        cr = 0,
        ca = 0,
        sum = 0;
      let ri: number;
      let read: number;
      if (ym < 0) {
        ri = -ym;
        read = x;
      } else {
        if (ym >= height) break;
        ri = ym;
        read = x + ymi;
      }

      for (let i = 0; i < blurKernelSize; i++) {
        if (ri >= height) break;
        const bm = blurMult[i];
        ca += bm[a2[read]];
        cr += bm[r2[read]];
        cg += bm[g2[read]];
        cb += bm[b2[read]];
        sum += blurKernel[i];
        ri++;
        read += width;
      }
      argb[x + yi] =
        ((ca / sum) << 24) |
        ((cr / sum) << 16) |
        ((cg / sum) << 8) |
        (cb / sum);
    }
    yi += width;
    ymi += width;
    ym++;
  }
  setPixels(pixels, argb);
}

function invertColors(pixels: Uint8ClampedArray): void {
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] ^= 255; // Invert Red
    pixels[i + 1] ^= 255; // Invert Green
    pixels[i + 2] ^= 255; // Invert Blue
  }
}

function dilate(pixels: Uint8ClampedArray, canvas: HTMLCanvasElement): void {
  const maxIdx = pixels.length / 4;
  const out = new Int32Array(maxIdx);
  let currIdx = 0;

  while (currIdx < maxIdx) {
    const currRowIdx = currIdx;
    const maxRowIdx = currIdx + canvas.width;

    while (currIdx < maxRowIdx) {
      let colOrig = getARGB(pixels, currIdx);
      let colOut = colOrig;

      const idxLeft = currIdx - 1 >= currRowIdx ? currIdx - 1 : currIdx;
      const idxRight = currIdx + 1 < maxRowIdx ? currIdx + 1 : currIdx;
      const idxUp =
        currIdx - canvas.width >= 0 ? currIdx - canvas.width : currIdx;
      const idxDown =
        currIdx + canvas.width < maxIdx ? currIdx + canvas.width : currIdx;

      const colLeft = getARGB(pixels, idxLeft);
      const colRight = getARGB(pixels, idxRight);
      const colUp = getARGB(pixels, idxUp);
      const colDown = getARGB(pixels, idxDown);

      const lum = (col: number) =>
        77 * ((col >> 16) & 0xff) +
        151 * ((col >> 8) & 0xff) +
        28 * (col & 0xff);

      let currLum = lum(colOrig);

      if (lum(colLeft) > currLum) {
        colOut = colLeft;
        currLum = lum(colLeft);
      }
      if (lum(colRight) > currLum) {
        colOut = colRight;
        currLum = lum(colRight);
      }
      if (lum(colUp) > currLum) {
        colOut = colUp;
        currLum = lum(colUp);
      }
      if (lum(colDown) > currLum) {
        colOut = colDown;
        currLum = lum(colDown);
      }
      out[currIdx++] = colOut;
    }
  }
  setPixels(pixels, out);
}
