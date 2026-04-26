// GST Invoice Generator
export class InvoiceGenerator {
    constructor() {
        this.gstNumber = '27GZCPS9353H1ZQ';
        this.legalName = 'Precision Forge Labs';
        this.email = 'support@akaraonline.co.in';
    }
    
    calculateGST(subtotal, customerState) {
        const gstRate = 18;
        const totalTax = (subtotal * gstRate) / 100;
        
        if (customerState.toLowerCase() === 'maharashtra') {
            return {
                cgst_rate: 9,
                cgst_amount: totalTax / 2,
                sgst_rate: 9,
                sgst_amount: totalTax / 2,
                igst_rate: 0,
                igst_amount: 0,
                total_tax: totalTax
            };
        } else {
            return {
                cgst_rate: 0,
                cgst_amount: 0,
                sgst_rate: 0,
                sgst_amount: 0,
                igst_rate: 18,
                igst_amount: totalTax,
                total_tax: totalTax
            };
        }
    }
    
    async generateInvoice(orderData) {
        const gst = this.calculateGST(orderData.subtotal, orderData.address.state);
        
        // Create invoice record in database
        // Generate PDF
        // Return invoice URL
        
        return {
            invoice_number: 'PFL/' + new Date().getFullYear() + '/00001',
            grand_total: orderData.subtotal + gst.total_tax
        };
    }
}

export const invoiceGenerator = new InvoiceGenerator();
