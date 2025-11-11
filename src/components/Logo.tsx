import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 250 50"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <text
        fontFamily="'PT Sans', sans-serif"
        fontSize="32"
        fontWeight="bold"
        y="30"
        dominantBaseline="middle"
      >
        <tspan fill="#E64968">super</tspan>
        <tspan fill="#5C67A8">moda</tspan>
      </text>
      <text
        fontFamily="'PT Sans', sans-serif"
        fontSize="14"
        fill="#5C67A8"
        x="158"
        y="42"
        dominantBaseline="middle"
      >
        calçados
      </text>
    </svg>
  );
}
