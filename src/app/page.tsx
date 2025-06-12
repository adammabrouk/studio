
import MenuDisplay from "@/components/menu-display";
import AIPopupButton from "@/components/ai-popup-button";

// This menu string will be used by the AI model. 
// In a real app, this might be dynamically fetched or parsed from a PDF.
const MENU_STRING = `
Appetizers:
- Bruschetta (Tomato, basil, garlic on toasted bread) - $8
- Caprese Salad (Fresh mozzarella, tomatoes, basil, balsamic glaze) - $10
- Garlic Knots (Served with marinara sauce) - $7

Main Courses:
- Spaghetti Carbonara (Pasta with pancetta, egg, Parmesan cheese, black pepper) - $15
- Grilled Salmon (Served with roasted vegetables and lemon-dill sauce) - $20
- Margherita Pizza (Tomato sauce, mozzarella, fresh basil) - $14
- Vegetarian Lasagna (Layers of pasta, ricotta, spinach, marinara, mozzarella) - $16
- Chicken Alfredo (Fettuccine pasta with creamy Alfredo sauce and grilled chicken) - $18

Desserts:
- Tiramisu (Coffee-soaked ladyfingers, mascarpone cream, cocoa powder) - $7
- Panna Cotta (Italian cooked cream dessert with berry coulis) - $6
- Chocolate Lava Cake (Warm chocolate cake with a molten center, served with vanilla ice cream) - $9

Drinks:
- Mineral Water (Still or Sparkling) - $2
- Soft Drinks (Coke, Diet Coke, Sprite, Fanta) - $3
- Fresh Orange Juice - $4
- House Wine (Red or White, per glass) - $8
`;

export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full">
      <MenuDisplay />
      <AIPopupButton menu={MENU_STRING} />
    </div>
  );
}
