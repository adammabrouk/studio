
"use client";

const MenuDisplay = () => {
  return (
    <div className="fixed inset-0 w-screen h-screen -z-10">
      <iframe
        src="/menu.pdf"
        className="w-full h-full opacity-90"
        title="Amano restaurant Menu PDF"
      ></iframe>
    </div>
  );
};

export default MenuDisplay;

