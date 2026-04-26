// Netlify Function: Verify Invoice
exports.handler = async (event) => {
    const invoiceNumber = event.path.split('/').pop();
    
    try {
        // Query database for invoice
        // Return invoice details
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                valid: true,
                invoice_number: invoiceNumber
            })
        };
    } catch (error) {
        return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Invoice not found' })
        };
    }
};
