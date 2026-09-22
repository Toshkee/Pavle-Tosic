import { Section, Heading } from "./Section";
import { MARKS, STACK_LINE } from "./content";
import GitHubActivity from "./GitHubActivity";
import StackOrbit from "./StackOrbit";
import StackMarquee from "./StackMarquee";
import Island from "./Island";

/* The stack as an orbit + one marquee + two still rows, split the way the
   Spec sheet splits it: tools picked freely (the outer ring, the moving
   row), tools the day job runs on and the two engines from personal
   projects (the inner ring, the still rows; both groups sit apart from
   the first, for different reasons, and the labels say which). StackOrbit
   and StackMarquee are the only client leaves (@iconify/react resolves
   real logos at runtime); this section itself stays a server component so
   it can compose the GitHub heatmap directly. Sits on the same dark glass
   panel as Log and Field, since the backdrop photo behind it can run
   bright. */
export default function Inside() {
  const [byChoice, ...rest] = MARKS;
  const inner = rest.flatMap((g) => g.marks);

  return (
    <Section id="stack" label="Stack" className="!py-[8svh] md:!py-[10svh]">
      <Heading kicker="Stack" index={4} lead={STACK_LINE} island={<Island name="ores" />}>
        The tools I reach for.
      </Heading>
      <div className="glass glass-panel glass-dark p-6 md:p-10 lg:p-12">
        <div className="inside-reveal grid gap-10 lg:grid-cols-[minmax(320px,440px)_1fr] lg:items-center lg:gap-14">
          {/* Below lg the orbit is ~300px of near-empty space for a third of
              a phone screen; the rows carry the same logos, so nothing is
              lost by giving them the full width there instead. */}
          <div className="hidden lg:block">
            <StackOrbit inner={inner} outer={byChoice.marks} />
          </div>
          <StackMarquee moving={byChoice} still={rest} />
        </div>
        <GitHubActivity />
      </div>
    </Section>
  );
}
