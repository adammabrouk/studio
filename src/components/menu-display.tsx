
"use client";

import Image from "next/image";

const MenuDisplay = () => {
  return (
    <div className="fixed inset-0 w-screen h-screen -z-10">
      <Image
        src="https://placehold.co/1200x1697.png" 
        alt="Restaurant Menu Background"
        layout="fill"
        objectFit="cover"
        className="opacity-90" 
        data-ai-hint="restaurant menu page"
        priority
      />
    </div>
  );
};

export default MenuDisplay;
