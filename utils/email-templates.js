// Email Templates
export const emailTemplates = {
    orderConfirmation: (orderData) => `
        <h1>Order Confirmed!</h1>
        <p>Thank you for your order.</p>
        <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
        <p><strong>Total:</strong> ₹${orderData.total}</p>
    `,
    
    shippingUpdate: (orderData) => `
        <h1>Your Order Has Shipped!</h1>
        <p>Order ${orderData.orderNumber} is on its way.</p>
        <p><strong>Tracking:</strong> ${orderData.trackingNumber}</p>
    `,
    
    passwordReset: (resetLink) => `
        <h1>Reset Your Password</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
    `
};
