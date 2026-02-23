'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  return (
    <button
      className="rounded border px-3 py-1 text-sm"
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
      }}
    >
      Logout
    </button>
  );
}
