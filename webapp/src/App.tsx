import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthForm from "./components/AuthForm/LoginForm";
import Game from "./pages/Game";
import Lobby from "./pages/Lobby";
import Menu from "./pages/Menu";
import DataHub from "./pages/Datahub";

function App() { 
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/datos" element={<DataHub />} />
        <Route path="/game" element={<Game />} />
        <Route path="/historic" element={<Navigate to="/datos" replace />} />
        <Route path="/stats" element={<Navigate to="/datos" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
