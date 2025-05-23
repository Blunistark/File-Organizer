import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4285F4',
    },
    secondary: {
      main: '#34A853',
    },
    // Accent color can be added as a custom field if needed, or mapped to secondary
    // For now, let's use secondary as the accent color or rely on primary/secondary for accents.
    // accent: {
    //   main: '#FBBC05',
    // },
    error: {
      main: '#EA4335',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#202124',
      secondary: '#5F6368',
    },
  },
  typography: {
    fontFamily: 'Roboto, system-ui, sans-serif',
    h1: {
      fontSize: '28px',
      fontWeight: 300,
    },
    h2: {
      fontSize: '24px',
      fontWeight: 400,
    },
    h3: {
      fontSize: '20px',
      fontWeight: 500,
    },
    h4: {
      fontSize: '18px',
      fontWeight: 500,
    },
    body1: {
      fontSize: '16px',
      fontWeight: 400,
    },
    body2: {
      fontSize: '14px',
      fontWeight: 400,
    },
    button: {
      fontSize: '14px',
      fontWeight: 500,
      textTransform: 'uppercase',
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* CssBaseline applies baseline styles and background color */}
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
