import type React from 'react';

const LogoIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="50" cy="50" r="48" className="fill-primary/10" />
    <g transform="translate(5 5) scale(0.9 0.9)">
      <path
        d="M60,25 Q50,18 40,25 C30,35 35,50 42,58 L50,75 L58,58 C65,50 70,35 60,25 Z"
        className="fill-accent opacity-70"
        transform="rotate(-10 50 50) translate(-3 0) scale(0.7)" // Smaller, slightly rotated leaf
      />
       <path
        d="M50 20 C 40 20, 30 30, 30 40 S 40 60, 50 60 S 70 50, 70 40 S 60 20, 50 20 M 50 25 C 57 25, 65 33, 65 40 S 57 55, 50 55 S 35 47, 35 40 S 43 25, 50 25"
        className="fill-primary/30 opacity-50" // Swirl pattern
        transform="scale(0.6) translate(32,32)"
      />
    </g>
    <text
      x="50%"
      y="50%"
      dominantBaseline="central"
      textAnchor="middle"
      fontFamily="Poppins, sans-serif"
      fontSize="40"
      fontWeight="700"
      className="fill-primary group-hover:fill-accent transition-colors duration-300"
    >
      OF
    </text>
  </svg>
);

export default LogoIcon;
