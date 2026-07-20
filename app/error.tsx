"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto mt-24 max-w-md px-4 text-center">
      <h1 className="text-xl font-semibold text-neutral-900">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        An unexpected error occurred. You can try again, or head back home.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button variant="secondary" onClick={reset}>
          Try again
        </Button>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
