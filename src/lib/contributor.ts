/**
 * The fields a display name is derived from. Both the tRPC list item and the
 * column header's own contributor type satisfy this shape.
 */
export type ContributorNameFields = {
  name: string | null;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
};

/**
 * A contributor may be a linked account or just an invited name, so the linked
 * account's details win where they exist.
 */
export function contributorDisplayName(
  contributor: ContributorNameFields
): string {
  return (
    contributor.user?.name ?? contributor.user?.email ?? contributor.name ?? "—"
  );
}
