import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dragdropdata from './Dragdropdata';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

function App() {
  return (
    // <Router >
    //   <Routes>
    //     <Route path="/viewCustomEntityKanban/:customEntitySpecId" element={<Dragdropdata />} />
    //     </Routes>
    // </Router>
    <div>
      <Dragdropdata />  
    </div>
  );
}

export default App;
