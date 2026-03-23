import { HashRouter, Routes, Route} from "react-router-dom";
import AuthForm from "./components/AuthForm/LoginForm";
import Game from "./pages/Game";
import Lobby from "./pages/Lobby";

function App() { 
    
  return (
      <HashRouter>
        <Routes>
          <Route path="/" element={<AuthForm />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/game" element={<Game />} />
        </Routes>
      </HashRouter>
  );
}

export default App;
