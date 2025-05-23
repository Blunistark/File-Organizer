/// <reference types="react-scripts" />

import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    accent: Palette['primary'];
  }
  interface PaletteOptions {
    accent?: PaletteOptions['primary'];
  }
}

// This augmentation is also needed for the Button component to accept 'accent' as a color prop.
// If you plan to use <Button color="accent">, you need this.
// If you only access accent via theme.palette.accent.main, this might not be strictly necessary
// but is good for consistency if you might use it on components later.
declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    accent: true;
  }
}

// If you also want to use it on other components that have a `color` prop, like SvgIcon, Chip, etc.
// declare module '@mui/material/SvgIcon' {
//   interface SvgIconPropsColorOverrides {
//     accent: true;
//   }
// }
// declare module '@mui/material/Chip' {
//   interface ChipPropsColorOverrides {
//     accent: true;
//   }
// }
