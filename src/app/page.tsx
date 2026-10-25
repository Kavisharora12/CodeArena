import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  ChartNoAxesColumnIncreasing,
  Code2,
  MessagesSquare,
} from "lucide-react";

const features = [
  {
    icon: Code2,
    title: "Practice with purpose",
    description:
      "Work through a growing collection of coding problems and build confidence one solution at a time.",
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    title: "See your progress",
    description:
      "Keep track of the problems you solve and revisit your submission history as you improve.",
  },
  {
    icon: BookOpenCheck,
    title: "Learn together",
    description:
      "Explore community solutions and discussions to discover different ways to approach a challenge.",
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden">
      <section className="relative border-b">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(249,115,22,0.12),transparent_58%)]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 sm:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-32">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 text-sm text-muted-foreground">
              <Code2 aria-hidden="true" className="size-4 text-primary" />
              A focused space to grow as a developer
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Compete. Code.{" "}
              <span className="text-primary">Conquer.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Sharpen your problem-solving skills with hands-on practice,
              meaningful progress, and ideas shared by the coding community.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/problems"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Explore problems
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex h-11 items-center justify-center rounded-md border bg-background px-5 text-sm font-semibold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Sign in
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Start practicing, follow your progress, and learn at your own pace.
            </p>
          </div>

          <div className="mx-auto w-full max-w-lg">
            <div className="rounded-2xl border bg-card p-5 shadow-xl shadow-orange-950/5 sm:p-7">
              <div className="flex items-center justify-between border-b pb-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Code2 aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold">Your practice, your pace</p>
                    <p className="text-sm text-muted-foreground">
                      A simple path to keep moving
                    </p>
                  </div>
                </div>
              </div>
              <ol className="mt-2">
                <li className="flex gap-4 border-b py-5 last:border-0">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    1
                  </span>
                  <div>
                    <p className="font-medium">Choose a challenge</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Find a problem that matches what you want to practice.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4 border-b py-5 last:border-0">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    2
                  </span>
                  <div>
                    <p className="font-medium">Work through your solution</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Take your time, test your thinking, and refine your code.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4 py-5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    3
                  </span>
                  <div>
                    <p className="font-medium">Learn from every attempt</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Review your progress and explore community perspectives.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MessagesSquare aria-hidden="true" className="size-4 text-primary" />
              Practice and learn with the community
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Built for the journey
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Make every practice session count.
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            CodeArena brings problem-solving, progress, and shared learning into
            one place—so you can focus on getting better.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-xl border bg-card p-6">
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 leading-7 text-muted-foreground">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t bg-card/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-center sm:justify-between sm:py-16">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Ready for your next challenge?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Find a problem and take the first step.
            </p>
          </div>
          <Link
            href="/problems"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:self-auto"
          >
            Browse problems
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
