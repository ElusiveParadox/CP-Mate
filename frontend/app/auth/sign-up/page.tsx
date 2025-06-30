// 'use client';

// import { SignUp } from '@clerk/nextjs';

// export default function SignUpPage() {
//   return (
//     <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
//       <SignUp path="/auth/sign-up" routing="path" signInUrl="/auth/sign-in" />
//     </div>
//   );
// }

'use client';

import { SignUp } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast, Toaster } from 'sonner';

export default function SignUpPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'sign_up_success') {
      toast.success('Sign up successful! 🎉 Welcome!');
    } else if (status === 'sign_up_failed') {
      toast.error('Sign up failed. Please try again.');
    }
  }, [searchParams]);

  return (
    <>
      <Toaster position="top-right" richColors />
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
        <SignUp
          path="/auth/sign-up"
          routing="path"
          signInUrl="/auth/sign-in"
          redirectUrl="/auth/sign-up?status=sign_up_success" // Optional override
        />
      </div>
    </>
  );
}
