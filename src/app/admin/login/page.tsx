import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-[400px] bg-paper px-8 py-12 sm:px-10">
        <div className="relative mx-auto h-[52px] w-[122px]">
          <Image src="/brand/logo-dark.png" alt="Shop Tafara" fill sizes="122px" loading="eager" className="object-contain" />
        </div>
        <p className="caps-sm mt-8 text-center text-muted">Studio admin</p>
        <div className="mt-8">
          <Suspense fallback={<LoginForm />}>
            <WithNext searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

async function WithNext({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  const { next } = await searchParams;
  return <LoginForm next={typeof next === "string" ? next : undefined} />;
}
