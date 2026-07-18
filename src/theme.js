import { createTheme } from '@mui/material/styles'

export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      // MUI's dark default paints both surfaces near-black (#121212); these
      // slate grays lift the page and cards to a softer dark.
      ...(mode === 'dark' && {
        background: {
          default: '#1a1e26',
          paper: '#242a35',
        },
      }),
      primary: {
        main: '#2196f3',
      },
      secondary: {
        main: '#7ec897',
      },
      info: {
        main: mode === 'dark' ? '#39404d' : '#EEEEEE',
      },
      error: {
        main: 'rgb(255, 64, 96)',
      },
    },
    components: {
      MuiListItemIcon: {
        styleOverrides: {
          // MUI 9 shrank the default to spacing(4.5); keep the classic 56px gap
          root: { minWidth: 56 },
        },
      },
    },
  })
