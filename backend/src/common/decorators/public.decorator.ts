import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as reachable without a JWT. Used for the read-only endpoints
 * the public portfolio consumes, and for the contact form submission.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
