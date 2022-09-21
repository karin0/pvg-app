import { adaptV4Theme, createTheme } from '@mui/material/styles'

const theme = createTheme(
  adaptV4Theme({
    palette: {
      primary: {
        main: '#2196f3',
      },
    },
  })
)

export default theme
