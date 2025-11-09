import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import './index.css';
import Home from './components/Home';
import FormatterPage from './pages/FormatterPage';
import AlignerPage from './pages/AlignerPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-full">
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/formatter" element={<FormatterPage />} />
            <Route path="/aligner" element={<AlignerPage />} />
          </Routes>
        </Router>
      </div>
    </QueryClientProvider>
  );
}

export default App;
