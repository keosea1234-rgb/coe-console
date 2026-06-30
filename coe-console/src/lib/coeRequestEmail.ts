import type { SourcingEvent } from '../domain/types';

// Shared inbox the eSourcing CoE monitors for buyer requests and follow-ups.
export const COE_INBOX_EMAIL = 'esourcing.coe@amcor.com';

export function scopeLine(event: SourcingEvent): string {
  const regions = (event.regions ?? [event.region]).join(', ');
  const types = (event.eventTypes ?? [event.type]).join(', ');
  return `${event.fy} / ${regions} / ${types}`;
}

// Opens the user's mail client with a request to the CoE, pre-filled with the
// event context. Mirrors the mailto pattern used by feedbackEmail.
export function openCoeRequestEmail(event: SourcingEvent, message: string) {
  const subject = `Request re ${event.id} - ${event.name}`;
  const body = [
    'Hi eSourcing CoE,',
    '',
    message.trim() || '(describe your request here)',
    '',
    '--- Request context ---',
    `Event: ${event.name}`,
    `ID: ${event.id}`,
    `Scope: ${scopeLine(event)}`,
    `Addressable: ${event.addressable}`,
    `Status: ${event.status}`,
    `Requestor: ${event.requestor ?? ''}`,
  ].join('\n');

  window.location.href = `mailto:${encodeURIComponent(COE_INBOX_EMAIL)}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}

// Admin-side counterpart: opens the CoE's mail client to reply to the buyer who
// submitted the request, pre-filled with the event context.
export function openRequestorReplyEmail(event: SourcingEvent, message: string) {
  const recipient = event.requestor?.includes('@') ? event.requestor : '';
  const subject = `Re: your eSourcing request ${event.id} - ${event.name}`;
  const body = [
    'Hi,',
    '',
    message.trim() || '(type your reply to the requestor here)',
    '',
    '--- Request context ---',
    `Event: ${event.name}`,
    `ID: ${event.id}`,
    `Scope: ${scopeLine(event)}`,
    `Status: ${event.status}`,
    '',
    'eSourcing CoE',
  ].join('\n');

  window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}
