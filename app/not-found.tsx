import Link from "next/link";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto mt-24 max-w-md px-4 text-center">
      <h1 className="font-serif text-2xl italic text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-stone">
        The page you&apos;re looking for doesn&apos;t exist or is no longer available.
      </p>
      <div className="mt-6 flex justify-center">
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
