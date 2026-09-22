import { Section, Heading } from "./Section";
import { MARKS, MARKS_SIDE, STACK_LINE } from "./content";
import GitHubActivity from "./GitHubActivity";
import StackOrbit from "./StackOrbit";
import StackMarquee from "./StackMarquee";

/* The stack as an orbit + a pair of marquees, split the way the Spec sheet
   splits it: tools picked freely (the outer ring, the first row), and
   tools the day job runs on plus the two engines (the inner ring, the
   second row). StackOrbit and StackMarquee are the only client leaves
   (@iconify/react resolves real logos at runtime); this section itself
   stays a server component so it can compose the GitHub heatmap directly.
   Sits on the same dark glass panel as Log and Field, since the backdrop
   photo behind it can run bright. */
export default function Inside() {
  const byChoice = MARKS[0].marks;
  const onTheJob = [...MARKS[1].marks, ...MARKS_SIDE];

  return (
    <Section id="stack" label="Stack" className="!py-[8svh] md:!py-[10svh]">
      <Heading lead={STACK_LINE}>Stack</Heading>
      <div className="glass glass-panel glass-dark p-6 md:p-10 lg:p-12">
        <div className="inside-reveal grid gap-10 lg:grid-cols-[minmax(240px,320px)_1fr] lg:items-center lg:gap-14">
          {/* Below lg the orbit is ~320px of near-empty space for a third of
              a phone screen; the marquee carries the same logos, so nothing
              is lost by giving it the full width there instead. */}
          <div className="hidden lg:block">
            <StackOrbit inner={onTheJob} outer={byChoice} />
          </div>
          <StackMarquee byChoice={byChoice} onTheJob={onTheJob} />
        </div>
        <GitHubActivity />
      </div>
    </Section>
  );
}
