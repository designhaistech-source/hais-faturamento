import haisPattern from "@/assets/hais-pattern-fade.svg.asset.json";

/** Hais pattern; the file already carries its own top fade. */
export function BrandPattern({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <img
        src={haisPattern.url}
        alt=""
        draggable={false}
        className="absolute bottom-[-38vh] left-[-13vh] h-[80vh] w-auto max-w-none brightness-120 saturate-115"
      />
    </div>
  );
}
