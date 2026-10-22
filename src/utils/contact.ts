import type { Promoter, Venue } from "../types/venue";

// Whether there's any way to get in touch: a website, social account or email.
export function hasContact(target: Venue | Promoter) {
    return !!(target.website || target.instagram || target.facebook || target.email);
}
