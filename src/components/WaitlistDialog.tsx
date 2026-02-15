import { useState, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import EmailSignupForm from './EmailSignupForm';

type WaitlistDialogProps = {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const WaitlistDialog = ({
  children,
  open,
  onOpenChange,
}: WaitlistDialogProps) => {
  const [isSuccess, setIsSuccess] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="type-heading-2">
            {isSuccess
              ? "You've joined the waitlist!"
              : 'Sign up for early access to Rivet'}
          </DialogTitle>
          <DialogDescription>
            {isSuccess
              ? "Don't want to wait? Book a demo with the founder."
              : "We're rolling out the Rivet beta to small groups of users to help us keep the quality high."}
          </DialogDescription>
        </DialogHeader>
        <EmailSignupForm onSuccessChange={setIsSuccess} />
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistDialog;
