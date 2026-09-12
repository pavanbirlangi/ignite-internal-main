import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function NotFound() {
  return (
    <section className="border-muted-foreground/30 bg-background flex min-h-140 items-center justify-center border-y px-6 py-16 text-center md:min-h-155">
      <div className="mx-auto flex max-w-xl flex-col items-center">
        <Image
          height={220}
          width={220}
          src="/images/404.png"
          alt="Page Not Found"
          className="h-35 w-auto md:h-47.5"
          priority
          unoptimized
        />

        <h1 className="mt-8 text-2xl leading-tight font-semibold tracking-tight text-white md:text-5xl">
          404 - Page Not Found
        </h1>

        <p className="text-muted-foreground mt-3 max-w-md text-base tracking-tight md:text-lg">
          The page you are looking for does not exist or have been removed from
          our website.
        </p>

        <Button
          asChild
          variant="primary"
          size="md"
          className="mt-8 px-6 py-3 font-semibold text-sm"
        >
          <Link href="/store">Explore Increddy</Link>
        </Button>
      </div>
    </section>
  )
}
