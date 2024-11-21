import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Dragdropdata from './Dragdropdata';


function App() {
  return (
    <Router >
    
      <Routes>
        <Route path="/viewCustomEntityKanban/:customEntitySpecId" element={<Dragdropdata />} />
        </Routes>
    </Router>
  );
}

export default App;
