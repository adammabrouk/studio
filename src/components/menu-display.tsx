
"use client";

const MenuDisplay = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-auto">
      <div className="fixed inset-0 -z-10 overflow-auto flex justify-center items-start">
            <div className="w-full" style={{ paddingTop: 'calc(1.414 * 100%)' }}> {/* Assuming A4 aspect ratio (1:1.414) */}
              <iframe
                src="/menu.pdf#zoom=Fit"
                className="absolute top-0 left-0 w-full h-full opacity-90"
                title="Amano restaurant Menu PDF"
                style={{ overflow: "auto" }}
              ></iframe>
            </div>


      </div>
    </div>
  );
};

export default MenuDisplay;


