import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t bg-muted">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center space-x-2">
            <Image src="/icon.png" alt="Doc Tailor" width={20} height={20} />
            <span className="font-semibold">Doc Tailor</span>
          </div>

          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground md:text-left">
          © {new Date().getFullYear()} Doc Tailor. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
