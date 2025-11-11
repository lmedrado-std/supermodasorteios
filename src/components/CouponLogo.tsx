import type { SVGProps } from 'react';

export function CouponLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 250 40"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <text
        fontFamily="'PT Sans', sans-serif"
        fontSize="28"
        fontWeight="bold"
        y="25"
        dominantBaseline="middle"
        fill="#DC2626"
      >
        <tspan>super</tspan>
        <tspan>moda</tspan>
      </text>
      <text
        fontFamily="'PT Sans', sans-serif"
        fontSize="12"
        fill="#DC2626"
        x="138"
        y="35"
        dominantBaseline="middle"
      >
        calçados
      </text>
    </svg>
  );
}
