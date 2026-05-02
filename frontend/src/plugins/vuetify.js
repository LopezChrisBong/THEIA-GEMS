// vuetify.js
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'

export default createVuetify({
  components,
  directives,
  icons: {
    iconfont: "md",
  },
  theme: {
    themes: {
      light: {
        colors: {
          primary: '#9B6B3A',
          secondary: '#C08B7C',
          accent: '#C49455',
          success: '#3D7A5A',
          error: '#B84040',
          warning: '#C49455',
          info: '#5A7A9B',
          background: '#C08B7C',
          surface: '#FDFAF6',
          'on-surface': '#3A2515',
          'on-primary': '#FDFAF6',
        },
      },
      dark: {
        colors: {
          primary: '#C49455',
          secondary: '#A8705F',
          accent: '#9B6B3A',
          success: '#3D7A5A',
          error: '#B84040',
          warning: '#C49455',
          info: '#5A7A9B',
          background: '#2A1A10',
          surface: '#3A2515',
        },
      },
    },
  },
});
