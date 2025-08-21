/**
 * 图片压缩工具
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1之间，越小文件越小
  maxSizeKB?: number; // 最大文件大小(KB)
}

/**
 * 压缩base64图片
 */
export const compressBase64Image = (
  base64: string,
  options: CompressOptions = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 400,
      maxHeight = 400,
      quality = 0.7,
      maxSizeKB = 200
    } = options;

    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('无法创建canvas上下文'));
        return;
      }

      // 计算压缩后的尺寸
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // 绘制压缩后的图片
      ctx.drawImage(img, 0, 0, width, height);

      // 尝试不同的质量级别，直到文件大小合适
      let currentQuality = quality;
      let compressedBase64 = '';
      
      const tryCompress = () => {
        compressedBase64 = canvas.toDataURL('image/jpeg', currentQuality);
        
        // 计算压缩后的大小(KB)
        const sizeKB = (compressedBase64.length * 3 / 4) / 1024;
        
        if (sizeKB <= maxSizeKB || currentQuality <= 0.1) {
          resolve(compressedBase64);
        } else {
          // 如果还是太大，进一步降低质量
          currentQuality -= 0.1;
          tryCompress();
        }
      };

      tryCompress();
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    img.src = base64;
  });
};

/**
 * 获取base64图片的大小(KB)
 */
export const getBase64Size = (base64: string): number => {
  return (base64.length * 3 / 4) / 1024;
};

/**
 * 批量压缩图片
 */
export const compressMultipleImages = async (
  images: string[],
  options: CompressOptions = {}
): Promise<string[]> => {
  const compressedImages: string[] = [];
  
  for (const base64 of images) {
    try {
      const compressed = await compressBase64Image(base64, options);
      compressedImages.push(compressed);
    } catch (error) {
      console.warn('图片压缩失败:', error);
      // 如果压缩失败，使用原图（但这可能导致存储问题）
      compressedImages.push(base64);
    }
  }
  
  return compressedImages;
};