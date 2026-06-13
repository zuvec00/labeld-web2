"use client";

/**
 * Renders an SVG asset tinted to the current text color, mirroring the mobile
 * app's `colorFilter` behaviour. The asset is used as a CSS mask so `color`
 * (via currentColor) controls the fill.
 */
export default function MaskIcon({
  src,
  size = 20,
  className,
}: {
  src: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={className}
      aria-hidden
      style={{
        display: "inline-block",
        width: size,
        height: size,
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
