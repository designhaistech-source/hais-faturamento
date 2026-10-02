import haisPattern from "@/assets/hais-pattern.svg";

/**
 * Original Hais pattern kept as a single grouped composition. The radial mask
 * is centered on the viewport bottom-left corner and dissolves it toward the
 * top/right so it never ends on a straight edge or sits behind the headline.
 */
const fadeMask =
  "radial-gradient(ellipse 95vh 55vh at 260px calc(100% - 40vh), #000 0%, #000 30%, rgb(0 0 0 / 0.55) 50%, rgb(0 0 0 / 0.15) 64%, transparent 76%)";

export function BrandPattern({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <img
        src={haisPattern}
        alt=""
        draggable={false}
        className="absolute bottom-[-40vh] left-[-260px] h-[110vh] w-auto max-w-none opacity-60"
        style={{ maskImage: fadeMask, WebkitMaskImage: fadeMask }}
      />
    </div>
  );
}
