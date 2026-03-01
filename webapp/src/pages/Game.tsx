import '../styles/App.css'
import AuthForm from './AuthForm.tsx';
import RegisterForm from './RegisterForm';
import { GameBoard } from '../components/gameBoard/GameBoard';
import GameSelector from './GameSelector.tsx';

function App() {
  return (
    <div className="App">
      <div>
        <h2>Welcome to the Software Arquitecture 2025-2026 course</h2>
        <RegisterForm />
      </div>

      <div>
        <h1>Tablero de Y</h1>
        <GameBoard size={5}/>
      </div>

      <div>
        <h2>Login</h2>
        <AuthForm />
      </div>

      <div>
        <h2>Select Game Mode</h2>
        <GameSelector />
      </div>
    </div>
  );
}

export default App;


//          <GameBoard size={5} />

