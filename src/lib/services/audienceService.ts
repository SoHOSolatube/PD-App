import { getAllContacts } from '@/lib/services/contactService';
import type { Contact } from '@/types';
import type { AudienceTarget } from '@/types';

/**
 * Resolves an audience target to a list of contacts.
 */
export async function resolveAudience(target: AudienceTarget): Promise<Contact[]> {
    const allContacts = await getAllContacts({});

    switch (target.type) {
        case 'all':
            return allContacts.filter((c) => c.status === 'active');

        case 'categories':
            if (!target.categoryIds || target.categoryIds.length === 0) {
                return allContacts.filter((c) => c.status === 'active');
            }
            return allContacts.filter(
                (c) =>
                    c.status === 'active' &&
                    c.categories.some((cat) => target.categoryIds!.includes(cat))
            );

        case 'event-registered':
            // TODO: Phase 5 — resolve from event registrations
            return [];

        default:
            return [];
    }
}
