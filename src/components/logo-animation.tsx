"use client";

import LogoIcon from "@/components/icons/logo-icon";

const LogoAnimation = () => {
  return (
    <div className="flex flex-col items-center justify-center group animate-logo-fade-in-scale">
      <LogoIcon className="w-24 h-24 md:w-32 md:h-32" />
    </div>
  );
};

export default LogoAnimation;
