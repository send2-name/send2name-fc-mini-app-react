import { sdk } from "@farcaster/frame-sdk";
import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import About from "./pages/About";

function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
