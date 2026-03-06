import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthForm from "./components/AuthForm/LoginForm";
import Game from "./pages/Game";

function App() { 
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;