import ErrorBoundary from './components/ErrorBoundary';
import KanaGame from './components/KanaGame';

function App() {
  return (
    <ErrorBoundary>
      <KanaGame />
    </ErrorBoundary>
  );
}

export default App;
