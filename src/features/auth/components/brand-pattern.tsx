import haisPattern from "@/assets/hais-pattern-fade.svg.asset.json";

/** Pattern institucional da Hais; o próprio arquivo já traz o fade superior. */
export function BrandPattern({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <img
        src={haisPattern.url}
        alt=""
        draggable={false}
        className="absolute bottom-0 left-0 h-[75vh] w-auto max-w-none"
      />
    </div>
  );
}
