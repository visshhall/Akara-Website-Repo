// Netlify Function: Process Payment Webhook
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    try {
        const signature = event.headers['x-razorpay-signature'];
        const payload = event.body;
        
        // Verify webhook signature
        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(payload)
            .digest('hex');
        
        if (signature !== expectedSignature) {
            return { statusCode: 401, body: 'Invalid signature' };
        }
        
        const data = JSON.parse(payload);
        
        // Update order status
        // Send confirmation email
        
        return {
            statusCode: 200,
            body: JSON.stringify({ received: true })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
