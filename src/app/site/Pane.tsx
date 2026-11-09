/* A monospace pane for the arch trees, notes and code excerpts on the case
   studies and /how-its-built. The source strings are hard-wrapped, so <pre>
   is the honest renderer: reflowing them would break the ASCII trees. Plain
   plate, no window chrome. 11px on a phone: at 12.5px the trees ran past
   the right edge of a 390px screen, cut off with no sign they scrolled. */
export default function Pane({
  file,
  children,
}: {
  file: string;
  children: React.ReactNode;
}) {
  return (
    <div className="plate overflow-hidden rounded-[8px]">
      <div className="border-b border-line px-4 py-2 text-[12px] text-faint">
        {file}
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-[1.6] sm:text-[12.5px] text-body">
        {children}
      </pre>
    </div>
  );
}
