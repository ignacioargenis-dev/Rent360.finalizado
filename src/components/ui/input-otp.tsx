'use client';

import * as React from 'react';
import { Minus } from "lucide-react";
import { cn } from '@/lib/utils';

interface InputOTPProps {
  maxLength?: number;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function InputOTP({
  maxLength = 6,
  value = '',
  onChange,
  disabled = false,
  className,
  ...props
}: InputOTPProps) {
  const [otp, setOtp] = React.useState(value);

  React.useEffect(() => {
    setOtp(value);
  }, [value]);

  const handleChange = (index: number, digit: string) => {
    if (disabled) return;

    const newOtp = otp.split('');
    newOtp[index] = digit;
    const newOtpString = newOtp.join('').slice(0, maxLength);
    
    setOtp(newOtpString);
    onChange?.(newOtpString);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = otp.split('');
      newOtp[index - 1] = '';
      const newOtpString = newOtp.join('');
      setOtp(newOtpString);
      onChange?.(newOtpString);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)} {...props}>
      {Array.from({ length: maxLength }, (_, index) => (
        <React.Fragment key={index}>
          <InputOTPSlot
            value={otp[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={disabled}
            maxLength={1}
            className="text-center"
          />
          {index < maxLength - 1 && <InputOTPSeparator />}
        </React.Fragment>
      ))}
    </div>
  );
}

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ ...props }, ref) => (
  <div ref={ref} {...props}>
    <Minus className="h-4 w-4" />
  </div>
));
InputOTPSeparator.displayName = "InputOTPSeparator";

const InputOTPSlot = React.forwardRef<
  React.ElementRef<'input'>,
  React.ComponentPropsWithoutRef<'input'>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="text"
    inputMode="numeric"
    className={cn(
      "relative h-10 w-10 text-center text-base font-medium transition-all duration-200",
      "border border-input bg-background text-foreground",
      "focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "rounded-md",
      className
    )}
    {...props}
  />
));
InputOTPSlot.displayName = "InputOTPSlot";

export { InputOTPSeparator, InputOTPSlot };
