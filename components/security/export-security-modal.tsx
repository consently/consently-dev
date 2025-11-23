'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportSecurityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerified: () => void;
    actionName?: string;
}

export function ExportSecurityModal({
    isOpen,
    onClose,
    onVerified,
    actionName = 'export data'
}: ExportSecurityModalProps) {
    const [step, setStep] = useState<'initial' | 'otp'>('initial');
    const [isLoading, setIsLoading] = useState(false);
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');

    const handleSendOtp = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: actionName }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send OTP');
            }

            setEmail(data.email);
            setStep('otp');
            toast.success('OTP sent to your email');
        } catch (error) {
            console.error('Error sending OTP:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to verify OTP');
            }

            toast.success('Identity verified successfully');
            onVerified();
            onClose();
            // Reset state after successful verification
            setTimeout(() => {
                setStep('initial');
                setOtp('');
            }, 500);
        } catch (error) {
            console.error('Error verifying OTP:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to verify OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
        // Reset state when closed without success
        setTimeout(() => {
            setStep('initial');
            setOtp('');
        }, 300);
    };

    return (
        <Modal
            open={isOpen}
            onClose={handleClose}
            title="Security Verification"
            description={`To ${actionName}, we need to verify your identity.`}
            size="sm"
        >
            <div className="py-2">
                {step === 'initial' ? (
                    <div className="flex flex-col items-center justify-center space-y-4 text-center p-4">
                        <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center">
                            <Lock className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-medium text-gray-900">Authentication Required</h3>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                For security reasons, we'll send a one-time password (OTP) to your registered email address.
                            </p>
                        </div>
                        <Button onClick={handleSendOtp} disabled={isLoading} className="w-full">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Send OTP'
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium">OTP Sent!</p>
                                <p>Please check your email <strong>{email}</strong> for the verification code.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="otp">Enter OTP Code</Label>
                            <Input
                                id="otp"
                                placeholder="123456"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                className="text-center text-2xl tracking-widest font-mono h-12"
                                maxLength={6}
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 text-center">
                                Code expires in 10 minutes
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button onClick={handleVerifyOtp} disabled={isLoading || otp.length !== 6} className="w-full">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Verify & Continue'
                                )}
                            </Button>
                            <Button variant="ghost" onClick={() => setStep('initial')} disabled={isLoading} className="w-full">
                                Back
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
