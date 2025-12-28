import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import Dashboard from './pages/Dashboard';
import PuzzleScreen from './pages/PuzzleScreen';
import LearningScreen from './pages/LearningScreen';
import Layout from './components/Layout';
import { runPDFProcessor } from './utils/runPDFProcessor';

function App() {
  // Run the PDF processor when the app starts
  useEffect(() => {
    console.log('App mounted, running PDF processor...');
    runPDFProcessor()
      .then(puzzles => {
        console.log(`PDF processor completed with ${puzzles.length} puzzles`);
      })
      .catch(error => {
        console.error('Error running PDF processor:', error);
      });
  }, []);

  return (
    <Router>
      <GameProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/puzzle/:type" element={<PuzzleScreen />} />
            <Route path="/learn/:type" element={<LearningScreen />} />
          </Routes>
        </Layout>
      </GameProvider>
    </Router>
  );
}

export default App;