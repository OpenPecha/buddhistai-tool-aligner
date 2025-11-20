import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import './index.css';
import './editor.css';
import Home from './components/Home';
import FormatterPage from './pages/FormatterPage';
import AlignerPage from './pages/AlignerPage';
import AlignmentWorkstation from './components/Aligner/components/AlignmentWorkstation';
import FormatterWorkstation from './components/Formatter/components/FormatterWorkstation';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from "./components/ui/sonner"
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
      <Router>
        <div className="h-full flex flex-col">
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes with layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Home />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="formatter" element={<FormatterPage />} />
              <Route path="formatter/:instanceId" element={<FormatterWorkstation />} />
              <Route path="aligner" element={<AlignerPage />} />
              <Route path="aligner/:sourceInstanceId/:targetInstanceId" element={<AlignmentWorkstation/>} />
            </Route>
          </Routes>
        </div>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
