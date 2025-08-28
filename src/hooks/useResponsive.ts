import { useTheme, useMediaQuery } from '@mui/material';

export const useResponsive = () => {
  const theme = useTheme();
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isTabletOrDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    isMobileOrTablet,
    isTabletOrDesktop,
    breakpoints: theme.breakpoints,
  };
};