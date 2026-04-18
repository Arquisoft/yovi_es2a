import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthForm from "./components/AuthForm/LoginForm";
import Game from "./pages/Game";
import Lobby from "./pages/Lobby";
import Menu from "./pages/Menu";
import DataHub from "./pages/Datahub";
import Ranking from "./pages/Ranking";
import ColorBends from "./components/Background";

function App() { 
  return (
  <div className="app-container">
    <ColorBends
      colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
      rotation={90}
      speed={0.2}
      scale={1}
      frequency={1}
      warpStrength={1}
      mouseInfluence={1}
      noise={0.15}
      parallax={0.5}
      iterations={1}
      intensity={1.5}
      bandWidth={6}
      transparent
      autoRotate={0}
    />
    <HashRouter>
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/datos" element={<DataHub />} />
        <Route path="/game" element={<Game />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/historic" element={<Navigate to="/datos" replace />} />
        <Route path="/stats" element={<Navigate to="/datos" replace />} />
      </Routes>
    </HashRouter>
  </div>
);
}

export default App;