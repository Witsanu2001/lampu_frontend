import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "../shared/ui/App";
import { CartProvider } from "../shared/context/CartContext";
import '../style/index.css';


createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <CartProvider>
      <App />
    </CartProvider>
  </BrowserRouter>
);