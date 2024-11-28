import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Country from './component/Country';
import State from './component/State';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Country/>}/>
        <Route path='/state' element={<State/>}/>
      </Routes>

    </Router>
  );
}

export default App;
