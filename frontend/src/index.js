import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
// Enable pixel-art theme by default (remove to revert to vector look)
document.body.classList.add('pixel-theme');
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
