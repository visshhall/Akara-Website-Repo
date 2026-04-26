// Device Fingerprinting & Tracking
export class DeviceTracker {
    async getFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('fingerprint', 2, 2);
        
        const fingerprint = {
            canvas: canvas.toDataURL(),
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            memory: navigator.deviceMemory || 'unknown',
            cores: navigator.hardwareConcurrency || 'unknown'
        };
        
        const str = JSON.stringify(fingerprint);
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    async trackLogin(userId, userEmail) {
        const fingerprint = await this.getFingerprint();
        
        // Check if new device
        // Send notification if needed
        // Log to database
        
        return fingerprint;
    }
}

export const deviceTracker = new DeviceTracker();
