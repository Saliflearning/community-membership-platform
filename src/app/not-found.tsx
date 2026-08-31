import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-hub-mist px-5">
      <section className="max-w-md rounded-lg bg-white p-6 text-center shadow-soft">
        <h1 className="text-2xl font-bold text-hub-ink">Record not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The membership record is invalid, expired from public lookup, or unavailable.
        </p>
        <Link className="mt-5 inline-flex rounded-md bg-hub-green px-5 py-3 font-bold text-white" href="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
