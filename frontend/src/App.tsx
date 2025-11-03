import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './index.css';
import Home from './components/Home';
import FormatterPage from './pages/FormatterPage';
import AlignerPage from './pages/AlignerPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/formatter" element={<FormatterPage />} />
        <Route path="/aligner" element={<AlignerPage />} />
      </Routes>
    </Router>
  );
}

export default App;
