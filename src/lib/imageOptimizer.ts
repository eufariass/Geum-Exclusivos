/**
 * Image Optimizer
 * Compresses and resizes images before upload
 */
import { FILE_UPLOAD, TOAST_MESSAGES } from './constants';
import { logger } from './logger';

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeBytes?: number;
}

/**
 * Optimize an image file
 */
export async function optimizeImage(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<File> {
  const {
    maxWidth = FILE_UPLOAD.MAX_IMAGE_WIDTH,
    maxHeight = FILE_UPLOAD.MAX_IMAGE_HEIGHT,
    quality = FILE_UPLOAD.IMAGE_COMPRESSION_QUALITY,
    maxSizeBytes = FILE_UPLOAD.MAX_IMAGE_SIZE_BYTES,
  } = options;

  // Check file type
  if (!FILE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    throw new Error(TOAST_MESSAGES.ERROR.INVALID_FILE_TYPE);
  }

  // If file is already small enough, return it
  if (file.size <= maxSizeBytes) {
    logger.debug('Image size OK, skipping optimization', { size: file.size });
    return file;
  }

  try {
    // Create image element
    const img = await loadImage(file);

    // Calculate new dimensions
    const { width, height } = calculateDimensions(
      img.width,
      img.height,
      maxWidth,
      maxHeight
    );

    // Create canvas and draw resized image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    ctx.drawImage(img, 0, 0, width, height);

    // Convert to blob
    const blob = await canvasToBlob(canvas, file.type, quality);

    // Check if optimization was successful
    if (blob.size > file.size) {
      logger.debug('Optimization increased file size, returning original');
      return file;
    }

    // Create new File object
    const optimizedFile = new File([blob], file.name, {
      type: file.type,
      lastModified: Date.now(),
    });

    logger.info('Image optimized', {
      originalSize: file.size,
      optimizedSize: optimizedFile.size,
      reduction: `${(((file.size - optimizedFile.size) / file.size) * 100).toFixed(1)}%`,
    });

    return optimizedFile;
  } catch (error) {
    logger.error('Error optimizing image', error);
    // Return original file if optimization fails
    return file;
  }
}

/**
 * Optimize multiple images
 */
export async function optimizeImages(
  files: File[],
  options: OptimizeImageOptions = {}
): Promise<File[]> {
  const promises = files.map((file) => optimizeImage(file, options));
  return Promise.all(promises);
}

/**
 * Load an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let newWidth = width;
  let newHeight = height;

  // Check if we need to scale down
  if (width > maxWidth || height > maxHeight) {
    const widthRatio = maxWidth / width;
    const heightRatio = maxHeight / height;
    const ratio = Math.min(widthRatio, heightRatio);

    newWidth = Math.round(width * ratio);
    newHeight = Math.round(height * ratio);
  }

  return { width: newWidth, height: newHeight };
}

/**
 * Convert canvas to blob
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      type,
      quality
    );
  });
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!FILE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: TOAST_MESSAGES.ERROR.INVALID_FILE_TYPE,
    };
  }

  // Check file size
  if (file.size > FILE_UPLOAD.MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: TOAST_MESSAGES.ERROR.FILE_TOO_LARGE,
    };
  }

  return { valid: true };
}
