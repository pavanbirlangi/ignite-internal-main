'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HelpService, type HelpArticle } from '@/lib/services/help.service'
import { HelpTopicDetail } from './HelpTopicDetail'

interface HelpTopicDetailWrapperProps {
  categorySlug: string
  topicSlug: string
}

export default function HelpTopicDetailWrapper({
  categorySlug,
  topicSlug,
}: HelpTopicDetailWrapperProps) {
  const router = useRouter()

  const [articles, setArticles] = useState<HelpArticle[]>([])
  const [topicTitle, setTopicTitle] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await HelpService.getHelpArticles(topicSlug)
        if (response?.data) {
          setArticles(response.data)
          // Get the subtopic title from the first article's relation
          if (response.data.length > 0 && response.data[0].help_subtopics) {
            setTopicTitle(response.data[0].help_subtopics.title)
          }
        }
      } catch (error) {
        console.error('Failed to fetch help articles', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchArticles()
  }, [topicSlug])

  if (isLoading) {
    return (
      <div className="py-20 text-center font-medium text-white">Loading...</div>
    )
  }

  // Format the title like the screenshot: "I cannot find the key?"
  const displayTitle = topicTitle
    ? topicTitle.trim().endsWith('?')
      ? topicTitle.trim()
      : `${topicTitle.trim()}?`
    : 'Help Articles'

  // The create ticket URL depends on the global flag from the items
  const isGlobal = articles.length > 0 && articles[0].help_subtopics.create_ticket_global
  const createTicketUrl = isGlobal
    ? '/help/create-ticket/global'
    : '/help/create-ticket'

  return (
    <HelpTopicDetail
      title={displayTitle}
      articles={articles}
      onBack={() => router.push(`/help/${categorySlug}`)}
      onCreateTicket={() => router.push(createTicketUrl)}
    />
  )
}
