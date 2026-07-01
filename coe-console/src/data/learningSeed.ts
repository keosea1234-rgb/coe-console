import type { LearningResource } from '../domain/templateTypes';

export function generateLearningSeed(): LearningResource[] {
  return [
    {
      id: 'learning-esourcing-basics',
      title: 'What is eSourcing?',
      description: 'A concise overview of eSourcing event types, supplier engagement, and where auctions fit.',
      type: 'guide',
      topic: 'eSourcing Fundamentals',
      estimatedMinutes: 12,
      resourceUrl: '/assets/learning/esourcing-fundamentals/what-is-esourcing.pdf',
      lastUpdated: '2026-01-22',
    },
    {
      id: 'learning-run-rfi',
      title: 'How to run an RFI',
      description: 'Step-by-step guidance for supplier discovery, qualification questions, and readiness gates.',
      type: 'quickref',
      topic: 'RFx Process',
      estimatedMinutes: 8,
      resourceUrl: '/assets/learning/rfx-process/run-an-rfi.pdf',
      lastUpdated: '2026-02-14',
    },
    {
      id: 'learning-rfq-auction',
      title: 'RFQ and reverse auction playbook',
      description: 'How to convert requirements into lots, bid sheets, auction rules, and decision-ready outputs.',
      type: 'guide',
      topic: 'Negotiation',
      estimatedMinutes: 18,
      resourceUrl: '/assets/learning/negotiation/rfq-reverse-auction-playbook.pdf',
      lastUpdated: '2026-03-09',
    },
    {
      id: 'learning-archlet-event-create',
      title: 'Archlet: create an event',
      description: 'Walkthrough for creating a sourcing event, configuring rounds, and setting submission timing.',
      type: 'video',
      topic: 'Archlet',
      estimatedMinutes: 10,
      resourceUrl: '/assets/learning/archlet/create-an-event.mp4',
      lastUpdated: '2026-04-05',
    },
    {
      id: 'learning-archlet-supplier-invite',
      title: 'Archlet: invite suppliers',
      description: 'Reference for supplier uploads, invitation messages, participation checks, and reminders.',
      type: 'quickref',
      topic: 'Archlet',
      estimatedMinutes: 6,
      resourceUrl: '/assets/learning/archlet/invite-suppliers.pdf',
      lastUpdated: '2026-04-18',
    },
    {
      id: 'learning-archlet-evaluation',
      title: 'Archlet: evaluate responses',
      description: 'How to review bids, normalize responses, compare scenarios, and prepare award recommendations.',
      type: 'video',
      topic: 'Archlet',
      estimatedMinutes: 14,
      resourceUrl: '/assets/learning/archlet/evaluate-responses.mp4',
      lastUpdated: '2026-05-11',
    },
    {
      id: 'learning-governance-basics',
      title: 'CoE governance basics',
      description: 'Decision rights, intake expectations, documentation standards, and approval checkpoints.',
      type: 'faq',
      topic: 'CoE Governance',
      estimatedMinutes: 9,
      resourceUrl: '/assets/learning/coe-governance/governance-basics.pdf',
      lastUpdated: '2026-05-28',
    },
  ];
}

export const LEARNING_SEED = generateLearningSeed();
