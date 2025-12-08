import { base44 } from "@/api/base44Client";

/**
 * Resize/compress an image Blob/File to stay under maxBytes, with iterative fallback.
 * Attempts WebP first (keeps alpha), then JPEG if needed.
 * NOW PRESERVES WEBP FORMAT IF ALREADY WEBP AND UNDER SIZE LIMIT.
 */
async function compressImageToTarget(file, {
  maxBytes = 14.5 * 1024 * 1024,     // ~14.5MB (service limit ~15MB)
  initialMaxDim = 3000,              // max width/height first pass
  minMaxDim = 1200,                  // don't shrink below this unless still too big
  initialQuality = 0.9,              // starting quality
  minQuality = 0.5                   // lowest quality we'll try
} = {}) {
  const isImage = /^image\//.test(file.type);
  if (!isImage) return file; // non-image: just return as-is

  // If already small enough AND is WebP, preserve it
  if (file.size <= maxBytes && file.type === 'image/webp') {
    console.log('✅ WebP file already under size limit, preserving original format');
    return file;
  }

  // If already small enough but not WebP, still return as-is
  if (file.size <= maxBytes) return file;

  const loadImage = (srcBlob) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(srcBlob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for compression"));
    };
    img.src = url;
  });

  const toBlob = (canvas, mime, quality) => new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("Canvas toBlob failed"));
      else resolve(blob);
    }, mime, quality);
  });

  const srcImg = await loadImage(file);

  let targetDim = initialMaxDim;
  let quality = initialQuality;

  // Iteratively try to meet the size target
  for (let attempt = 0; attempt < 8; attempt++) {
    // Compute scaled dimensions (keep aspect)
    const scale = Math.min(1, targetDim / Math.max(srcImg.naturalWidth, srcImg.naturalHeight));
    const w = Math.max(1, Math.round(srcImg.naturalWidth * scale));
    const h = Math.max(1, Math.round(srcImg.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(srcImg, 0, 0, w, h);

    // Try WebP first to preserve transparency and reduce size
    let outBlob = null;
    let outTypeTried = "image/webp";
    try {
      outBlob = await toBlob(canvas, "image/webp", quality);
    } catch {
      // Fallback to JPEG
      outTypeTried = "image/jpeg";
      outBlob = await toBlob(canvas, "image/jpeg", quality);
    }

    if (outBlob.size <= maxBytes) {
      const ext = outTypeTried === "image/webp" ? "webp" : "jpg";
      const newName = (file.name || "image").replace(/\.[^.]+$/, "") + `.${ext}`;
      console.log(`✅ Image compressed to ${(outBlob.size / 1024 / 1024).toFixed(2)}MB using ${outTypeTried}`);
      return new File([outBlob], newName, { type: outTypeTried, lastModified: Date.now() });
    }

    // If still too big: reduce quality first, then dimensions
    if (quality > minQuality) {
      quality = Math.max(minQuality, quality - 0.1);
    } else {
      // reduce dimensions by ~15% each step, until minMaxDim, else break
      const nextDim = Math.round(targetDim * 0.85);
      if (nextDim < minMaxDim && targetDim !== minMaxDim) {
        targetDim = minMaxDim;
      } else if (nextDim >= minMaxDim) {
        targetDim = nextDim;
      } else {
        // We already hit minQuality and min dimension; return the smallest we produced.
        // Pick JPEG at lower quality for one last try
        const jpegBlob = await toBlob(canvas, "image/jpeg", minQuality);
        if (jpegBlob.size < file.size) {
          const newName = (file.name || "image").replace(/\.[^.]+$/, "") + `.jpg`;
          console.log(`✅ Image compressed to ${(jpegBlob.size / 1024 / 1024).toFixed(2)}MB using JPEG (last resort)`);
          return new File([jpegBlob], newName, { type: "image/jpeg", lastModified: Date.now() });
        }
        break;
      }
    }
  }

  // If we couldn't compress sufficiently, return the original; upload may fail.
  console.warn('⚠️ Could not compress image below size limit, uploading original');
  return file;
}

/**
 * Upload a file with automatic image compression if it's too large.
 * Returns the uploaded public URL string.
 * NOW FULLY SUPPORTS WEBP FORMAT.
 */
export async function safeUploadFile(file) {
  console.log(`📤 Uploading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB, type: ${file.type})`);
  
  // Validate file type - EXPLICITLY ALLOW WEBP
  const isImage = /^image\/(jpeg|jpg|png|webp|gif|bmp|tiff|svg\+xml)$/i.test(file.type);
  if (!isImage && file.type && file.type.startsWith('image/')) {
    console.warn(`⚠️ Unusual image type: ${file.type}, attempting upload anyway`);
  } else if (!isImage && file.type) {
    throw new Error(`Unsupported file type: ${file.type}. Please upload an image file (JPG, PNG, WebP, GIF).`);
  }

  // If it's an image and too large, compress first
  let candidate = file;
  const MAX_BYTES = 14.5 * 1024 * 1024; // ~14.5MB
  
  if (file.type.startsWith('image/') && file.size > MAX_BYTES) {
    console.log(`🔧 Image too large (${(file.size / 1024 / 1024).toFixed(2)}MB), compressing...`);
    candidate = await compressImageToTarget(file, { maxBytes: MAX_BYTES });
  }

  // If still too big, try one more aggressive pass
  if (candidate.type.startsWith('image/') && candidate.size > MAX_BYTES) {
    console.log(`🔧 Still too large, attempting aggressive compression...`);
    candidate = await compressImageToTarget(candidate, {
      maxBytes: MAX_BYTES,
      initialMaxDim: 2200,
      minMaxDim: 900,
      initialQuality: 0.8,
      minQuality: 0.4
    });
  }

  // Final guard: if still too big, throw a friendly error
  if (candidate.size > MAX_BYTES) {
    const mb = (candidate.size / (1024 * 1024)).toFixed(1);
    throw new Error(`This image is still too large to upload (${mb}MB). Please resize and try again, or paste a direct image URL.`);
  }

  console.log(`✅ Uploading ${candidate.type}: ${candidate.name} (${(candidate.size / 1024 / 1024).toFixed(2)}MB)`);
  
  const { file_url } = await base44.integrations.Core.UploadFile({ file: candidate });
  
  console.log(`✅ Upload successful: ${file_url}`);
  return file_url;
}

// Convenience alias some components might use
export async function safeUpload(file) {
  return safeUploadFile(file);
}

// Default export for backward compatibility
export default {
  safeUploadFile,
  safeUpload
};