import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20 text-white">
      <div className="berry-hero rounded-[32px] p-10 md:p-16">
        <div className="mb-4 inline-flex rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-1 text-sm text-purple-200">
          BerrySDK Documentation
        </div>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight md:text-6xl">
          Use BerryProtocol and BerryOTP with a docs experience inspired by Fumadocs.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
          Learn how to connect to WhatsApp Web, send rich messages, use AI label support,
          and build OTP flows with copy-code, quick reply, and expiration logic.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/docs/berryprotocol"
            className="rounded-2xl bg-purple-500 px-5 py-3 font-medium text-white transition hover:bg-purple-400"
          >
            Open BerryProtocol Docs
          </Link>
          <Link
            href="/docs/berryotp"
            className="rounded-2xl border border-purple-300/20 px-5 py-3 font-medium text-white/90 transition hover:bg-white/5"
          >
            Open BerryOTP Docs
          </Link>
        </div>
      </div>
    </main>
  );
}
