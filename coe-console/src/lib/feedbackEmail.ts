import type { SourcingEvent } from '../domain/types';

function feedbackUrl(eventId: string) {
  return `${window.location.origin}/feedback/${encodeURIComponent(eventId)}`;
}

export function canEmailFeedback(event: SourcingEvent) {
  return !!event.requestor && event.requestor.includes('@');
}

export function openFeedbackEmail(event: SourcingEvent) {
  if (!canEmailFeedback(event)) return false;

  const url = feedbackUrl(event.id);
  const subject = `Feedback request for ${event.id}`;
  const body = [
    `Hi,`,
    ``,
    `Please share your eSourcing CoE feedback for this event:`,
    `${event.name}`,
    ``,
    `Open the NPS survey: ${url}`,
    ``,
    `Thank you.`,
  ].join('\n');

  window.location.href = `mailto:${encodeURIComponent(event.requestor ?? '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return true;
}
