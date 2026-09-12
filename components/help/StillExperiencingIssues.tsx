import React from 'react'

const StillExperiencingIssues = ({
  onCreateTicket,
}: {
  onCreateTicket: () => void
}) => {
  return (
    <div className="border-border bg-secondary/40 rounded-[20px] border p-6 text-center md:p-10">
      <h2 className="mb-2 text-lg font-semibold text-white md:text-[28px]">
        Are you still experiencing issues?
      </h2>
      <p className="text-muted-foreground mx-auto mb-5 max-w-md text-sm font-medium">
        Don&apos;t worry! Raise a ticket and our support team will get back to
        you as soon as possible
      </p>
      <button
        onClick={onCreateTicket}
        className="bg-primary hover:bg-primary/90 w-full cursor-pointer rounded-[6px] px-6 py-3.75 text-sm font-semibold text-white transition-colors sm:w-auto"
      >
        Create a Ticket
      </button>
    </div>
  )
}

export default StillExperiencingIssues
