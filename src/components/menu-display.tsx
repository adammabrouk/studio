"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MenuDisplay = () => {
  return (
    <div className="w-full h-[500px] overflow-y-auto rounded-lg border bg-card shadow-md p-1">
      <Image
        src="https://placehold.co/800x1130.png"
        alt="Restaurant Menu"
        width={800}
        height={1130}
        className="w-full h-auto"
        data-ai-hint="food menu"
        priority
      />
    </div>
  );
};

export default MenuDisplay;
