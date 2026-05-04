import { notFound } from "next/navigation";

// RSVP feature is disabled site-wide — no public form, no admin preview.
// The route returns 404 so the URL doesn't reveal that the form exists.
// To re-enable, restore the previous handler from git history.
export default function RsvpBarePage(): never {
  notFound();
}
