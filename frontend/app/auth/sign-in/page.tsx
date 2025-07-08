// 'use client';

// import { SignIn } from '@clerk/nextjs';

// export default function SignInPage() {
//   return (
//     <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
//       <SignIn path="/auth/sign-in" routing="path" signUpUrl="/auth/sign-up" />
//     </div>
//   );
// }

'use client';

import { SignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast, Toaster } from 'sonner';

export default function SignInPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'signed_in') {
      toast.success('Signed in successfully! 👋');
    } else if (status === 'sign_in_failed') {
      toast.error('Sign in failed. Try again.');
    } else if (status === 'signed_out') {
      toast('Signed out. See you soon 👋');
    }
  }, [searchParams]);

  return (
    <>
      <Toaster position="top-right" richColors />
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
        <SignIn
          path="/auth/sign-in"
          routing="path"
          signUpUrl="/auth/sign-up"
          redirectUrl="/auth/sign-in?status=signed_in"
        />
      </div>
    </>
  );
}
