'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HelpService } from '@/lib/services/help.service'
import { ChooseIssueType } from './ChooseIssueType'
import ConsoleIcon from '../icons/help/console-icon'
import TruckIcon from '../icons/help/TruckIcon'
import CardIcon from '../icons/help/CardIcon'
import ChatIcon from '../icons/help/ChatIcon'
import type { IssueCategory } from '@/types/HelpTypes'

// ──────────────────── Issue Categories ────────────────────

const issueCategories: IssueCategory[] = [
  {
    id: 'product-activation',
    title: 'Product Activation',
    description: 'The product was not delivered and other delivery problems',
    icon: <ConsoleIcon />,
  },
  {
    id: 'product-delivery',
    title: 'Product Delivery',
    description: 'The product was not delivered and other delivery problems',
    icon: <TruckIcon />,
  },
  {
    id: 'payments',
    title: 'Payments',
    description: 'Having difficulties & discrepancy in making payments.',
    icon: <CardIcon />,
  },
  {
    id: 'other',
    title: 'Other',
    description:
      'I have encountered other problems that are not listed & described here.',
    icon: <ChatIcon />,
  },
]

// ──────────────────── Component ────────────────────

export default function HelpPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<IssueCategory[]>(issueCategories)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await HelpService.getHelpItems()
        if (response?.data?.issue_types) {
          const fetchedCategories = response.data.issue_types.map((item) => {
            const typeData = item.help_issues_types_id
            return {
              id: typeData.slug,
              title: typeData.name,
              description: typeData.description,
              icon: typeData.icon,
              redirect: typeData.redirect ?? null,
              createTicketGlobal: typeData.create_ticket_global ?? false,
            }
          })
          setCategories(fetchedCategories)
        }
      } catch (error) {
        console.error('Failed to fetch help categories', error)
      }
    }
    fetchCategories()
  }, [])

  return (
    <ChooseIssueType
      categories={categories}
      onSelectCategory={(cat) => {
        // If the item has a redirect URL, go directly there (ignore slug)
        if (cat.redirect) {
          router.push(cat.redirect)
          return
        }
        // Otherwise navigate to the slug-based help page.
        router.push(`/help/${cat.id}`)
      }}
    />
  )
}
