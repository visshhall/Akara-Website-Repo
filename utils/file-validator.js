// File Upload Validation
export async function validateProductImage(file) {
    // Size check (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        throw new Error('Image too large. Maximum size is 5MB.');
    }
    
    // Type check
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, and WebP allowed.');
    }
    
    // Magic bytes verification
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    const signatures = {
        jpeg: [[0xFF, 0xD8, 0xFF]],
        png: [[0x89, 0x50, 0x4E, 0x47]],
        webp: [[0x52, 0x49, 0x46, 0x46]]
    };
    
    const isValidSignature = Object.values(signatures).some(sigs => 
        sigs.some(sig => sig.every((byte, i) => bytes[i] === byte))
    );
    
    if (!isValidSignature) {
        throw new Error('File signature invalid. Possible security threat.');
    }
    
    return true;
}
