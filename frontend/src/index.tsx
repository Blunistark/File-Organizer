import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4285F4',
      light: '#7BAAF7',
      dark: '#3367D6',
    },
    secondary: {
      main: '#34A853',
      light: '#68C77D',
      dark: '#2D8545',
    },
    accent: {
      main: '#FBBC05',
      light: '#FCD050',
      dark: '#F3B600',
    },
    error: {
      main: '#EA4335',
      light: '#F07C73',
      dark: '#D62516',
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
      letterSpacing: '-0.5px',
    },
    h2: {
      fontSize: '24px',
      fontWeight: 400,
      letterSpacing: '-0.25px',
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
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: 1.43,
    },
    button: {
      fontSize: '14px',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: '#4285F4',
            },
            '&.Mui-focused': {
              boxShadow: '0 0 0 2px rgba(66,133,244,0.2)',
            },
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'background-color 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.04)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <App />
      </LocalizationProvider>
    </ThemeProvider>
  </React.StrictMode>
);