// Image Metadata Removal & Processing
export class ImageProcessor {
    async stripMetadata(file) {
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
                            reject(new Error('Failed to process image'));
                            return;
                        }
                        
                        const cleanFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        
                        resolve(cleanFile);
                    }, file.type, 0.95);
                };
                
                img.onerror = () => reject(new Error('Invalid image'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }
    
    async compressAndStrip(file, maxWidth = 1920, maxHeight = 1920, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width = Math.floor(width * ratio);
                        height = Math.floor(height * ratio);
                    }
                    
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Compression failed'));
                            return;
                        }
                        
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        
                        resolve({
                            file: compressedFile,
                            originalSize: file.size,
                            newSize: compressedFile.size,
                            reduction: Math.round((1 - compressedFile.size / file.size) * 100)
                        });
                    }, 'image/jpeg', quality);
                };
                
                img.onerror = () => reject(new Error('Invalid image'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('Read failed'));
            reader.readAsDataURL(file);
        });
    }
}

export const imageProcessor = new ImageProcessor();
