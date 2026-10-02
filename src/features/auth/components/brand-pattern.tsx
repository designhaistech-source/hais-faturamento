import haisPattern from "@/assets/hais-pattern.svg";

/**
 * Original Hais pattern kept as a single grouped composition. The radial mask
 * is centered on the viewport bottom-left corner and dissolves it toward the
 * top/right so it never ends on a straight edge or sits behind the headline.
 */
const fadeMask =
  "radial-gradient(ellipse 72vh 50vh at 220px calc(100% - 32vh), #000 0%, #000 22%, rgb(0 0 0 / 0.5) 45%, rgb(0 0 0 / 0.12) 62%, transparent 74%)";

export function BrandPattern({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <img
        src={haisPattern}
        alt=""
        draggable={false}
        className="absolute bottom-[-32vh] left-[-220px] h-[130vh] w-auto max-w-none opacity-60"
        style={{ maskImage: fadeMask, WebkitMaskImage: fadeMask }}
      />
    </div>
  );
}
