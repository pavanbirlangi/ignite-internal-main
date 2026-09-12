'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HelpService, type HelpTopic } from '@/lib/services/help.service'
import { HelpTopicsList } from './HelpTopicsList'

interface HelpTopicsListWrapperProps {
  categorySlug: string
}

export default function HelpTopicsListWrapper({
  categorySlug,
}: HelpTopicsListWrapperProps) {
  const router = useRouter()
  const [topics, setTopics] = useState<HelpTopic[]>([])
  const [categoryName, setCategoryName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await HelpService.getHelpTopics(categorySlug)
        if (response?.data) {
          setTopics(response.data)
          if (response.data.length > 0 && response.data[0].issue_type) {
            setCategoryName(response.data[0].issue_type.name)
          }
        }
      } catch (error) {
        console.error('Failed to fetch help topics', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTopics()
  }, [categorySlug])

  if (isLoading) {
    return (
      <div className="py-20 text-center font-medium text-white">Loading...</div>
    )
  }

  if (topics.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-[780px] flex-col items-center gap-4 py-20 text-center">
        <p className="text-muted-foreground text-sm font-medium">
          No topics found for this category.
        </p>
        <button
          onClick={() => router.push('/help')}
          className="text-primary text-sm hover:underline"
        >
          ← Back to Help
        </button>
      </div>
    )
  }

  // The create ticket URL depends on the global flag from the items
  const isGlobal =
    topics.length > 0 && topics[0].issue_type.create_ticket_global
  const createTicketUrl = isGlobal
    ? '/help/create-ticket/global'
    : '/help/create-ticket'

  return (
    <HelpTopicsList
      topics={topics}
      title={categoryName || 'Help Topics'}
      onBack={() => router.push('/help')}
      onSelectTopic={(topic) => {
        if (topic.redirect) {
          router.push(topic.redirect)
          return
        }
        router.push(`/help/${categorySlug}/${topic.slug}`)
      }}
      onCreateTicket={() => router.push(createTicketUrl)}
    />
  )
}
