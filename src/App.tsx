import React, { Suspense, lazy } from 'react';
import './App.css';
import ErrorBoundary from './components/common/ErrorBoundary';
import { PopaneProvider } from './context/PopaneContext';
import { ThemeProvider } from './context/ThemeContext';

const HomePage = lazy(() => import('./home/HomePage'));

const AppLoader = () => (
  <div className="app-loader">
    <div className="loader-spinner"></div>
    <span className="loader-text">Loading POPANE...</span>
  </div>
);

function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <PopaneProvider>
          <Suspense fallback={<AppLoader />}>
            <HomePage />
          </Suspense>
        </PopaneProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
