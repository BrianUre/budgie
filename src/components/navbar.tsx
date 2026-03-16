import Link from "next/link";
import Image from "next/image";

/** App-wide navigation bar. Displays the Budgie logo linking to the home page. */
export function Navbar() {
  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center px-4 py-4 sm:px-8">
        <Link href="/">
          <Image src="/budgie-logo.svg" alt="Budgie" width={32} height={32} />
        </Link>
      </div>
    </nav>
  );
}
