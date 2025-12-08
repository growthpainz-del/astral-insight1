import { base44 } from "@/api/base44Client";
import { safeUploadFile } from "@/components/utils/safeUpload";

/**
 * Convert WebP (or any image) to JPEG for compatibility with vision APIs
 * that may not support WebP
 */
async function convertToJpeg(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to convert image to JPEG'));
            return;
          }
          const jpegFile = new File(
            [blob], 
            file.name.replace(/\.[^.]+$/, '.jpg'),
            { type: 'image/jpeg' }
          );
          resolve(jpegFile);
        }, 'image/jpeg', 0.95);
      };
      img.onerror = () => reject(new Error('Failed to load image for conversion'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image file and use OCR to detect card name/number.
 * ENHANCED: Better number detection for cards with visible numbers on the image.
 * Returns: { file_url, name?, number?, confidence? }
 */
export async function ocrCardImageFromFile(file) {
  console.log(`🔍 OCR: Processing ${file.name} (${file.type})`);
  
  // Validate file type
  const validImageTypes = /^image\/(jpeg|jpg|png|webp|gif|bmp|tiff|svg\+xml)$/i;
  
  if (!validImageTypes.test(file.type)) {
    console.error(`❌ Invalid file type: ${file.type}`);
    throw new Error(`Unsupported file type: ${file.type}. Please upload an image file (JPG, PNG, WebP, GIF).`);
  }
  
  console.log(`✅ File type valid: ${file.type}`);
  
  // Convert WebP to JPEG for OCR compatibility
  let fileToUpload = file;
  if (file.type === 'image/webp') {
    console.log('🔄 Converting WebP to JPEG for OCR compatibility...');
    try {
      fileToUpload = await convertToJpeg(file);
      console.log(`✅ Converted to JPEG: ${fileToUpload.name}`);
    } catch (conversionError) {
      console.warn('⚠️ WebP conversion failed, attempting with original:', conversionError);
    }
  }

  // Upload the file
  const file_url = await safeUploadFile(fileToUpload);
  console.log(`✅ Uploaded: ${file_url}`);

  // ENHANCED OCR with better number detection
  try {
    console.log('📖 Reading card text from image (enhanced number detection)...');
    const prompt = [
      "You are analyzing a divination/oracle card image to extract the card's information.",
      "",
      "CRITICAL: Look very carefully for a CARD NUMBER printed on the image:",
      "- Numbers are often small and in corners (top-left, top-right, bottom corners)",
      "- Numbers can be 1-3 digits (e.g., 0, 7, 14, 78, 100)",
      "- Numbers may be stylized, Roman numerals, or decorative",
      "- Check ALL corners and edges carefully",
      "- If you see ANY number that looks like a card position/number, extract it",
      "",
      "Also extract the card NAME:",
      "- Usually the largest, most prominent text",
      "- Often at the top or bottom of the card",
      "- May be in fancy/decorative font",
      "",
      "Return JSON with:",
      "- number: the card number if found (IMPORTANT: return as integer, not string)",
      "- name: the full card name as printed",
      "- confidence: 0-1 score (0.8+ means high confidence)",
      "",
      "EXAMPLES:",
      "- If you see '7' in a corner and 'The Chariot' at bottom → {number: 7, name: 'The Chariot', confidence: 0.9}",
      "- If you see '14' top-right and 'Temperance' at top → {number: 14, name: 'Temperance', confidence: 0.95}",
      "- If you only see 'The Fool' but no number → {number: null, name: 'The Fool', confidence: 0.85}",
      "",
      "Be precise and extract EXACTLY what you see."
    ].join("\n");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          number: { type: ["number", "null"] },
          confidence: { type: "number" }
        }
      },
      file_urls: [file_url]
    });

    console.log('✅ OCR result:', result);

    return {
      file_url,
      name: result?.name || null,
      number: result?.number ?? null,
      confidence: result?.confidence ?? 0
    };

  } catch (ocrError) {
    console.error('❌ OCR failed:', ocrError);
    return {
      file_url,
      name: null,
      number: null,
      confidence: 0,
      error: ocrError.message || 'OCR failed'
    };
  }
}

export default {
  ocrCardImageFromFile
};