import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface StoreHeaderProps {
    title: string
    totalProducts: number
    startIndex: number
    endIndex: number
    labels?: {
        home?: string
        store?: string
        showing?: string
        products?: string
        of?: string
    }
}

const StoreHeader: React.FC<StoreHeaderProps> = ({
    title,
    totalProducts,
    startIndex,
    endIndex,
    labels,
}) => {
    const home = labels?.home ?? 'Home'
    const store = labels?.store ?? 'Store'
    const showing = labels?.showing ?? 'Showing'
    const products = labels?.products ?? 'products'
    const of = labels?.of ?? 'of'

    return (
        <div className="flex flex-col gap-5 w-full">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1">
                <Link href="/" className=" font-medium text-base leading-5.25 text-muted-foreground hover:text-white transition-colors">
                    {home}
                </Link>
                <ChevronRight className="size-4 text-muted-foreground" />
                <span className="font-semibold text-base leading-5.25 text-white">
                    {store}
                </span>
            </div>

            {/* Title and Count */}
            <div className="sm:flex text-[24px] items-end gap-5 pb-2.5">
                <h1 className=" font-medium leading-tight text-white tracking-tight">
                    {title}
                </h1>
                <span className=" font-medium text-[18px] leading-5.75 text-muted-foreground mb-0.5">
                    ({showing} {startIndex}-{endIndex} {products} {of} {totalProducts} {products})
                </span>
            </div>
        </div>
    )
}

export default StoreHeader
