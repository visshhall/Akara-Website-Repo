// Netlify Function: Contact Form Handler
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    try {
        const { name, email, subject, message } = JSON.parse(event.body);
        
        // Send email to support
        // Log to database
        
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Message sent successfully' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
