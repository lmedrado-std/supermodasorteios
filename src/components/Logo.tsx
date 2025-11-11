import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="180"
      height="40"
      viewBox="0 0 180 40"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
        <text
          fontFamily="'PT Sans', sans-serif"
          fontSize="26"
          fontWeight="bold"
          fill="hsl(var(--primary))"
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
        >
          Supermoda
        </text>
    </svg>
  );
}
