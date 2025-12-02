'use server';

import { razorpayConfig } from './config';
import Razorpay from 'razorpay';
import { z } from 'zod';

const OrderInputSchema = z.object({
  amount: z.number().min(100), // Amount in paise
  currency: z.string().default('INR'),
});

export async function createOrder(input: z.infer<typeof OrderInputSchema>) {
    try {
        const validatedInput = OrderInputSchema.parse(input);

        if (razorpayConfig.key_id.startsWith('YOUR_')) {
             console.error("Razorpay keys are not configured. Please add them to your environment variables.");
             return { error: 'Payment gateway is not configured.' };
        }
        
        const instance = new Razorpay({
            key_id: razorpayConfig.key_id,
            key_secret: razorpayConfig.key_secret,
        });

        const options = {
            amount: validatedInput.amount,
            currency: validatedInput.currency,
            receipt: `receipt_order_${Date.now()}`,
        };

        const order = await instance.orders.create(options);
        
        return {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
        };

    } catch (error: any) {
        console.error("Failed to create Razorpay order:", error);
        return { error: 'Could not create payment order. Please try again.' };
    }
}

export async function verifyPayment(data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
    // This function is a placeholder for verifying the payment signature.
    // In a real application, you would use the 'crypto' module to create an HMAC-SHA256 hash
    // of the order_id and payment_id with your key_secret, and compare it to the received signature.
    console.log('Verifying payment (placeholder):', data);
    
    // For demonstration, we'll assume the payment is always valid.
    const isSignatureValid = true;

    if (isSignatureValid) {
        return { success: true, message: 'Payment verified successfully.' };
    } else {
        return { success: false, error: 'Payment verification failed.' };
    }
}
