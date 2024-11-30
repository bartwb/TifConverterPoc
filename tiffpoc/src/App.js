import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';

import Poc from './Poc';

function App() {
  return (
    <Router>
    <div className="App">
      <Routes>
        <Route path="/" element={<Poc/>} />
      </Routes>
    </div>

  </Router>
  );
}

export default App;
