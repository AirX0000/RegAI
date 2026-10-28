/**
 * Image processing and optimization utilities for Axiaris RegAI
 * Supports client-side compression, transparency preservation, and Base64 conversion
 */

export interface ImageProcessResult {
    dataUrl: string;
    width: number;
    height: number;
    format: string;
    sizeKb: number;
}

/**
 * Resizes an image file (PNG, JPG, SVG, WebP) maintaining aspect ratio
 * and returns a clean Base64 data URL. Preserves transparent background for PNG.
 */
export async function processImageFile(
    file: File,
    maxWidth = 600,
    maxHeight = 300,
    quality = 0.92
): Promise<ImageProcessResult> {
    if (!file) throw new Error('Файл не предоставлен');

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type.toLowerCase())) {
        throw new Error('Неподдерживаемый формат. Пожалуйста, используйте PNG, JPG, WebP или SVG.');
    }

    if (file.size > 10 * 1024 * 1024) {
        throw new Error('Размер файла превышает 10 МБ. Выберите файл меньшего объема.');
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const rawDataUrl = e.target?.result as string;
            if (!rawDataUrl) return reject(new Error('Не удалось прочитать файл'));

            const img = new Image();
            img.onload = () => {
                try {
                    let width = img.naturalWidth || img.width || 400;
                    let height = img.naturalHeight || img.height || 200;

                    // Calculate target dimensions maintaining aspect ratio
                    let targetW = width;
                    let targetH = height;

                    if (targetW > maxWidth) {
                        targetH = Math.round((targetH * maxWidth) / targetW);
                        targetW = maxWidth;
                    }
                    if (targetH > maxHeight) {
                        targetW = Math.round((targetW * maxHeight) / targetH);
                        targetH = maxHeight;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, targetW);
                    canvas.height = Math.max(1, targetH);
                    const ctx = canvas.getContext('2d');

                    if (!ctx) return reject(new Error('Не удалось инициализировать Canvas 2D'));

                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    // Clear canvas to ensure transparent background for PNG/WebP/SVG
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg';
                    const outputMime = isJpeg ? 'image/jpeg' : 'image/png';
                    const outputDataUrl = canvas.toDataURL(outputMime, quality);
                    const approxSizeKb = Math.round((outputDataUrl.length * 0.75) / 1024);

                    resolve({
                        dataUrl: outputDataUrl,
                        width: canvas.width,
                        height: canvas.height,
                        format: outputMime.split('/')[1].toUpperCase(),
                        sizeKb: approxSizeKb
                    });
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = () => reject(new Error('Не удалось декодировать изображение'));
            img.src = rawDataUrl;
        };

        reader.onerror = () => reject(new Error('Ошибка чтения файла'));
        reader.readAsDataURL(file);
    });
}
