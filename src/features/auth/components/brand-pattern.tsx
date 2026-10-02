import haisPattern from "@/assets/hais-pattern.svg";

/**
 * Original Hais pattern kept as a single grouped composition. The radial mask
 * is centered on the viewport bottom-left corner and dissolves it toward the
 * top/right so it never ends on a straight edge or sits behind the headline.
 */
const fadeMask =
  "radial-gradient(ellipse 110vh 72vh at 120px calc(100% - 18vh), #000 0%, #000 20%, rgb(0 0 0 / 0.5) 40%, rgb(0 0 0 / 0.12) 55%, transparent 66%)";

export function BrandPattern({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <img
        src={haisPattern}
        alt=""
        draggable={false}
        className="absolute bottom-[-18vh] left-[-120px] h-[125vh] w-auto max-w-none opacity-60"
        style={{ maskImage: fadeMask, WebkitMaskImage: fadeMask }}
      />
    </div>
  );
}
