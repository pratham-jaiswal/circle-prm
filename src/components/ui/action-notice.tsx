type ActionNoticeProps = {
  notice?: string;
};

const NOTICE_MESSAGES: Record<string, string> = {
  "note-deleted": "Note deleted.",
  "person-deleted": "Person deleted.",
  "event-deleted": "Event deleted.",
  "interaction-deleted": "Interaction deleted.",
  "reminder-deleted": "Reminder deleted.",
  "relationship-deleted": "Relationship deleted.",
};

export function ActionNotice({ notice }: ActionNoticeProps) {
  const message = notice ? NOTICE_MESSAGES[notice] : undefined;

  if (!message) {
    return null;
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      {message}
    </div>
  );
}
