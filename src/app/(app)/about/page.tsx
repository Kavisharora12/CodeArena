import Link from "next/link";
import { ArrowRight, BookOpenCheck, Code2, MessagesSquare } from "lucide-react";

const destinations = [
  {
    href: "/problems",
    title: "Practice problems",
    description:
      "Browse available challenges and open a problem workspace to practice.",
    icon: Code2,
  },
  {
    href: "/solution",
    title: "Community discussions",
    description:
      "Read and share approaches to coding challenges with the community.",
    icon: MessagesSquare,
  },
  {
    href: "/problems",
    title: "Track your progress",
    description: "Sign in to follow your solved-problem progress as you practice.",
    icon: BookOpenCheck,
  },
];

export default function ExplorePage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-6 py-16 sm:py-20">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          CodeArena · Compete. Code. Conquer.
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Explore CodeArena
        </h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          Practice coding challenges, follow your progress, and learn from
          different approaches shared by the community.
        </p>
      </section>

      <section
        aria-label="Explore CodeArena features"
        className="mt-12 grid gap-5 md:grid-cols-3"
      >
        {destinations.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={title}
            href={href}
            className="group rounded-xl border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-accent/40"
          >
            <Icon aria-hidden="true" className="size-6 text-primary" />
            <h2 className="mt-5 text-xl font-semibold">{title}</h2>
            <p className="mt-2 leading-7 text-muted-foreground">
              {description}
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Explore
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform group-hover:translate-x-1"
              />
            </span>
          </Link>
        ))}
      </section>

      <p className="mt-12 border-t pt-6 text-sm text-muted-foreground">
        Challenges are added by CodeArena administrators. If the problem list
        is empty, check back when new challenges are available.
      </p>
    </main>
  );
}
