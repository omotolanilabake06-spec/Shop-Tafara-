/** The studio's alert addresses: "a@x.com, b@y.com" becomes ["a@x.com", "b@y.com"]. */
export const ownerEmails = (value: string) =>
  value
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
