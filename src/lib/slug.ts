const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const isValidSlug = (value: string) => SLUG_RE.test(value);

export const slugify = (raw: string) => {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "post";
};
