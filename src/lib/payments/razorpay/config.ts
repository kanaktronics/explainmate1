// This file holds the configuration for Razorpay.
// In a real application, you would replace the placeholder values
// with your actual Razorpay Key ID and Key Secret.

// IMPORTANT: Do NOT commit your actual keys to a public repository.
// Use environment variables to keep them secure.

export const razorpayConfig = {
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_RnqyYTgS9TsvAc',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'RAwvliHBWHAJvxR5AYxMx0N',
};
