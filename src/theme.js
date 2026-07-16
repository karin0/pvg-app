import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#7ec897',
    },
    info: {
      main: '#EEEEEE',
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

export default theme
