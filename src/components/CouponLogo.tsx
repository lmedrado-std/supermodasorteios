import type { SVGProps } from 'react';

export function CouponLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="139"
      height="33"
      viewBox="0 0 139 33"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id="gold_grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FDE047' }} />
          <stop offset="100%" style={{ stopColor: '#F59E0B' }} />
        </linearGradient>
      </defs>
      <path
        d="M56.833 0.93L42.213 15.49V32.07H56.833V0.93Z"
        fill="#DC2626"
      ></path>
      <path
        d="M42.213 15.49L27.593 0.93H0.933001L21.033 20.89L23.233 18.57L42.213 32.07V15.49Z"
        fill="#DC2626"
      ></path>
      <path
        d="M27.593 0.93L42.213 15.49V32.07H27.593V0.93Z"
        fill="url(#gold_grad)"
      ></path>
      <text
        fontFamily="'PT Sans', sans-serif"
        fontSize="18"
        fontWeight="bold"
        fill="#DC2626"
        x="70"
        y="24"
      >
        Supermoda
      </text>
    </svg>
  );
}
