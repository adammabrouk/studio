
"use client";

const MenuDisplay = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-auto">
      <div className="w-screen h-screen">
        <iframe
          src="/menu.pdf#zoom=Fit"
          className="w-full h-full opacity-90 overflow-auto"
          title="Amano restaurant Menu PDF"
          style={{ overflow: "auto" }}
        ></iframe>
      </div>
    </div>
  );
};

export default MenuDisplay;


