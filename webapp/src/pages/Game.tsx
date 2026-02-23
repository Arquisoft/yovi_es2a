import './styles/App.css'
import RegisterForm from './RegisterForm';
import { GameBoard } from '../components/gameBoard/GameBoard';

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
    </div>
  );
}

export default App;


//          <GameBoard size={5} />

