'use client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Home() {
  const { data, status } = useSession();
  return (
    <main>
      <Link href={'/api/auth/signin'}>登录</Link>
      <br />
      <Link href={'/api/auth/signout'}>注销</Link>
      <br />
      <Link href={'/api/auth/session'}>会话</Link>
      <br />
      <p>https://authjs.dev/getting-started/providers/oauth-tutorial#create-server-hook</p>
      <p>{JSON.stringify(data)}</p>
      <p>{status}</p>
    </main>
  );
}
