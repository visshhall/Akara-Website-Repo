// Rate Limiting System
export class RateLimiter {
    constructor() {
        this.limits = {
            login: { max: 5, window: 3600000 }, // 5 attempts per hour
            signup: { max: 3, window: 3600000 },
            imageUpload: { max: 10, window: 3600000 },
            apiCall: { max: 100, window: 60000 } // 100 per minute
        };
    }
    
    check(action, identifier) {
        const key = `rateLimit_${action}_${identifier}`;
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        const now = Date.now();
        const window = this.limits[action].window;
        
        // Remove old entries
        const recent = data.filter(time => now - time < window);
        
        if (recent.length >= this.limits[action].max) {
            const oldestAttempt = recent[0];
            const waitTime = Math.ceil((oldestAttempt + window - now) / 60000);
            throw new Error(`Rate limit exceeded. Try again in ${waitTime} minutes.`);
        }
        
        recent.push(now);
        localStorage.setItem(key, JSON.stringify(recent));
        
        return true;
    }
}

export const rateLimiter = new RateLimiter();
