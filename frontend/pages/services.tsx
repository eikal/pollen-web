import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ServicesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/uploads');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Redirecting to My Data...</p>
    </div>
  );
}
