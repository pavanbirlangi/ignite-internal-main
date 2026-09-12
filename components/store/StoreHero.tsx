import Image from 'next/image'

interface StoreHeroProps {
  title?: string
  description?: string
  bannerImage?: string
}

const StoreHero = ({
  title = 'Discover. Compare. Play.',
  description = 'Browse games that match your play-style. Filter, compare, and checkout in seconds.',
  bannerImage,
}: StoreHeroProps) => {
  const bannerUrl = bannerImage
    ? `${process.env.NEXT_PUBLIC_CMS_API_URL}/assets/${bannerImage}`
    : '/images/common/header-image.jpg'

  return (
    <div className="relative -mt-30 flex h-100 w-full flex-col overflow-hidden px-4 md:h-105">
      <div className="absolute inset-0 h-full w-full">
        <div className="absolute inset-0 z-0 h-full w-full transform">
          <Image
            src={bannerUrl}
            alt="Hero Background"
            fill
            className="origin-top object-cover object-top"
            priority
            quality={100}
          />
        </div>
        <div
          className="to-background absolute inset-0 z-10 bg-linear-to-r from-transparent via-(--background-80)"
          style={{
            background:
              'linear-gradient(90deg, var(--background-0) 0%, var(--background-80-rgb) 40%, var(--background) 100%)',
            transform: 'matrix(-1, 0, 0, 1, 0, 0)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-20 mx-auto mb-24 flex h-full max-w-360 flex-col items-start justify-end-safe gap-6 md:w-310">
        <div className="animate-fade-in-up max-w-150 max-lg:px-4">
          <h1 className="mb-4 text-3xl leading-tight font-semibold text-white md:text-5xl">
            {title}
          </h1>
          <p className="text-muted-foreground max-w-100 leading-relaxed font-medium sm:max-w-136.5 sm:text-base md:text-lg">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

export default StoreHero
