import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import './index.css';
import Home from './components/Home';
import FormatterPage from './pages/FormatterPage';
import AlignerPage from './pages/AlignerPage';
import AlignmentWorkstation from './components/Aligner/components/AlignmentWorkstation';
import FormatterWorkstation from './components/Formatter/components/FormatterWorkstation';

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
            <Route path="/formatter/:instanceId" element={<FormatterWorkstation />} />
            <Route path="/aligner" element={<AlignerPage />} />
            <Route path="/aligner/:sourceInstanceId/:targetInstanceId" element={<AlignmentWorkstation/>} />
          </Routes>
        </Router>
      </div>
    </QueryClientProvider>
  );
}

export default App;
