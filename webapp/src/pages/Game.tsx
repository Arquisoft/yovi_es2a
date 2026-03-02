import '../styles/App.css'
import '../styles/Game.css'
import { GameBoard } from '../components/gameBoard/GameBoard';

function App() {
  return (
    <div className="App">
      <div>
        <h1>Tablero de Y</h1>
        <GameBoard size={6}/>
      </div>
    </div>
  );
}

export default App;


//          <GameBoard size={5} />

