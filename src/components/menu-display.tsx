
"use client";

const MenuDisplay = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-auto">
      {/* Add a container for better mobile scrolling control */}
      <div className="w-full h-full overflow-auto">
        <iframe
          src="/menu.pdf#zoom=Fit"
          className="w-full h-full opacity-90"
          title="Amano restaurant Menu PDF"
        ></iframe> 
      </div>
    </div>
  );
};

export default MenuDisplay;


