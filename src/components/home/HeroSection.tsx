export default function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="relative isolate overflow-hidden px-5 pt-14 pb-8 text-center sm:pt-20 sm:pb-10">
      <div aria-hidden="true" className="pointer-events-none absolute top-8 left-[8%] -z-10 size-24 -rotate-12 rounded-4xl bg-soft/50 sm:size-32" />
      <div aria-hidden="true" className="pointer-events-none absolute top-24 right-[6%] -z-10 size-20 rounded-full bg-soft/60 sm:size-28" />
      <h1 id="hero-heading" className="mx-auto mt-6 max-w-4xl text-[38px] leading-[1.1] font-semibold tracking-[-0.045em] sm:text-5xl lg:text-[60px]">A little edit.<br className="sm:hidden" /> <span className="text-primary">Endless possibilities.</span></h1>
      <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted">Your image toolbox, all in one place. Simple, private, and free.</p>
    </section>
  );
}
