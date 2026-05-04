import { notFound } from "next/navigation";

// RSVP feature is disabled site-wide — tokenized links also 404 so the URL
// surface gives away nothing. To re-enable, restore the previous handler
// from git history.
export default function RsvpTokenPage(): never {
  notFound();
}
