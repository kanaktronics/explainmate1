
'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Zap, Image, Infinity, Clock, AlertCircle, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/lib/app-context';
import { createOrder } from '@/lib/payments/razorpay/actions';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useFirebase, setDocument } from '@/firebase';
import { doc } from 'firebase/firestore';
import { add } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useRouter } from 'next/navigation';


export function ProMembershipView() {
    const { toast } = useToast();
    const { studentProfile, setStudentProfile, user, postLoginAction, clearPostLoginAction } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failure'>('idle');
    const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const { firestore } = useFirebase();
    const router = useRouter();

    useEffect(() => {
        if (postLoginAction === 'upgrade' && user) {
            setIsPhoneDialogOpen(true);
            clearPostLoginAction();
        }
    }, [postLoginAction, user, clearPostLoginAction]);

    const handleInitiatePurchase = () => {
        if (!user) {
            router.push('/auth?reason=pro-purchase');
            return;
        }
        setIsPhoneDialogOpen(true);
    };

    const handleRazorpayPayment = async () => {
        setIsLoading(true);

        if (!/^\d{10}$/.test(phoneNumber)) {
            toast({ variant: 'destructive', title: 'Invalid Phone Number', description: 'Please enter a valid 10-digit phone number.' });
            setIsLoading(false);
            return;
        }

        if (!user || !firestore) {
             toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to purchase a Pro membership.' });
             setIsLoading(false);
             setIsPhoneDialogOpen(false);
             return;
        }

        try {
            const response = await createOrder({ amount: 19900, currency: 'INR' }); // Price in paise
            if (response.error || !response.orderId) {
                throw new Error(response.error || 'Failed to create order.');
            }
        
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
                amount: response.amount,
                currency: response.currency,
                name: 'ExplainMate Pro',
                description: '2-Month Membership',
                order_id: response.orderId,
                handler: async function (res: any) {
                    const now = new Date();
                    const expirationDate = add(now, { months: 2 });
                    
                    const updatedProfile = { 
                        ...studentProfile, 
                        isPro: true,
                        proExpiresAt: expirationDate.toISOString(),
                    };
                    setStudentProfile(updatedProfile);
                    
                    const profileRef = doc(firestore, 'users', user.uid);
                    await setDocument(profileRef, { isPro: true, proExpiresAt: expirationDate.toISOString() }, { merge: true });

                    setPaymentStatus('success');
                    toast({
                        title: 'Payment Successful!',
                        description: "Welcome to ExplainMate Pro! All features are now unlocked.",
                    });
                },
                prefill: {
                    name: studentProfile.name,
                    email: studentProfile.email,
                    contact: phoneNumber
                },
                theme: {
                    color: '#FF8216'
                }
            };
            
            // This is a browser-only API
            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (res: any) {
                setPaymentStatus('failure');
                toast({
                    variant: 'destructive',
                    title: 'Payment Failed',
                    description: res.error.description,
                });
            });
            rzp.open();

        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Could not initiate payment. Please try again.',
            });
        } finally {
            setIsLoading(false);
            setIsPhoneDialogOpen(false);
        }
    };
    
    if (paymentStatus === 'success' || studentProfile.isPro) {
        return (
            <div className="max-w-2xl mx-auto text-center">
                <Card>
                    <CardHeader>
                        <Zap className="h-16 w-16 text-yellow-400 mx-auto" />
                        <CardTitle className="text-4xl font-headline text-primary">You are a Pro Member!</CardTitle>
                        <CardDescription>All ExplainMate Pro features have been unlocked. Enjoy unlimited learning!</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }
    
    if (paymentStatus === 'failure') {
        return (
            <div className="max-w-2xl mx-auto text-center">
                <Card>
                    <CardHeader>
                        <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
                        <CardTitle className="text-4xl font-headline text-destructive">Payment Failed</CardTitle>
                        <CardDescription>Something went wrong with your payment. Please try again or contact support if the issue persists.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button onClick={() => setPaymentStatus('idle')} className="w-full">Try Again</Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <>
            <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Your Phone Number</DialogTitle>
                        <DialogDescription>
                            Please enter your 10-digit phone number to proceed with the payment. This is required by our payment provider.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">
                                Phone
                            </Label>
                            <Input
                                id="phone"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="col-span-3"
                                placeholder="e.g., 9876543210"
                                type="tel"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleRazorpayPayment} disabled={isLoading}>
                            {isLoading ? 'Processing...' : 'Proceed to Payment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="max-w-4xl mx-auto space-y-8">
                <header className="text-center space-y-2">
                    <h1 className="text-5xl font-headline text-primary">Upgrade to ExplainMate Pro</h1>
                    <p className="text-xl text-muted-foreground">
                        Unlock unlimited access and powerful features to supercharge your learning.
                    </p>
                </header>

                <Card className="shadow-lg border-primary/50">
                    <CardHeader className="items-center text-center">
                        <Badge variant="destructive" className="mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 py-1 px-4 text-sm">Best Value</Badge>
                        <CardTitle className="text-3xl font-headline">Pro Membership</CardTitle>
                        <div className="flex items-baseline gap-2">
                        <p className="text-5xl font-bold text-primary">₹199</p>
                        <p className="text-2xl font-semibold text-muted-foreground"><del>₹359</del></p>
                        </div>
                        <CardDescription>/ 2 months (Limited Time Offer)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <ul className="space-y-4 text-lg">
                            <li className="flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                                <span><span className="font-semibold">Unlimited</span> explanations & quizzes (vs. 5 explanations & 1 quiz per day)</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                                <span><span className="font-semibold">Upload images</span> and diagrams for analysis</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                                <span>Ask <span className="font-semibold">longer, more complex questions</span></span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                                <span>Choose the number of <span className="font-semibold">quiz questions (up to 15)</span></span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                                <span>Select quiz <span className="font-semibold">difficulty (Easy, Medium, Hard)</span></span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                                <span><span className="font-semibold">Faster</span> response times</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                                <span><span className="font-semibold">Dedicated "Pro" badge</span> on your profile</span>
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleInitiatePurchase} disabled={isLoading} className="w-full text-lg py-6 bg-gradient-to-r from-primary to-orange-500 hover:opacity-90 text-primary-foreground">
                            {isLoading ? 'Processing...' : 'Buy Pro Now'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </>
    );
}
