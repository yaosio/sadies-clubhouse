// Tiny IMA ADPCM (4 bits a sample) so a recorded sound can live inside the game files as text.
// Bytes: predictor (16 bits), step index, then two samples a byte.
const STEP = [7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88, 97, 107, 118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767];
const MOVE = [-1, -1, -1, -1, 2, 4, 6, 8];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function next(pred, idx, code) {
  const step = STEP[idx];
  let d = step >> 3;
  if (code & 4) d += step; if (code & 2) d += step >> 1; if (code & 1) d += step >> 2;
  return [clamp(code & 8 ? pred - d : pred + d, -32768, 32767), clamp(idx + MOVE[code & 7], 0, 88)];
}

export function encode(pcm) {
  const out = [pcm[0] & 255, (pcm[0] >> 8) & 255, 0];
  let pred = pcm[0], idx = 0, half = -1;
  for (let i = 1; i < pcm.length; i++) {
    const step = STEP[idx];
    let diff = pcm[i] - pred, code = 0;
    if (diff < 0) { code = 8; diff = -diff; }
    if (diff >= step) { code |= 4; diff -= step; }
    if (diff >= step >> 1) { code |= 2; diff -= step >> 1; }
    if (diff >= step >> 2) code |= 1;
    [pred, idx] = next(pred, idx, code);
    if (half < 0) half = code; else { out.push(half | (code << 4)); half = -1; }
  }
  if (half >= 0) out.push(half);
  return Uint8Array.from(out);
}

// back to numbers between -1 and 1 (what the sound system plays)
export function decode(bytes) {
  let pred = (bytes[0] | (bytes[1] << 8)) << 16 >> 16, idx = bytes[2];
  const a = new Float32Array((bytes.length - 3) * 2 + 1);
  a[0] = pred / 32768;
  for (let i = 3, k = 1; i < bytes.length; i++) for (const code of [bytes[i] & 15, bytes[i] >> 4]) {
    [pred, idx] = next(pred, idx, code); a[k++] = pred / 32768;
  }
  return a;
}
