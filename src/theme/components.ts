import { Components, Theme } from '@mui/material/styles';

export const components: Components<Omit<Theme, 'components'>> = {
  MuiContainer: {
    styleOverrides: {
      root: {
        paddingLeft: '16px',
        paddingRight: '16px',
        '@media (min-width: 600px)': {
          paddingLeft: '24px',
          paddingRight: '24px',
        },
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: 'none',
        fontWeight: 500,
        padding: '8px 16px',
        '@media (max-width: 600px)': {
          padding: '6px 12px',
          fontSize: '0.8125rem',
        },
      },
      sizeSmall: {
        padding: '4px 8px',
        fontSize: '0.8125rem',
        '@media (max-width: 600px)': {
          padding: '3px 6px',
          fontSize: '0.75rem',
        },
      },
      sizeLarge: {
        padding: '12px 24px',
        fontSize: '1rem',
        '@media (max-width: 600px)': {
          padding: '10px 20px',
          fontSize: '0.875rem',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        '@media (max-width: 600px)': {
          borderRadius: 8,
          margin: '0 8px',
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        '@media (max-width: 600px)': {
          borderRadius: 4,
        },
      },
    },
  },
  MuiTableContainer: {
    styleOverrides: {
      root: {
        '@media (max-width: 900px)': {
          '& .MuiTable-root': {
            minWidth: 'auto',
          },
          '& .MuiTableCell-root': {
            padding: '8px 4px',
            fontSize: '0.8125rem',
          },
          '& .MuiTableCell-head': {
            fontWeight: 600,
          },
        },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        '@media (max-width: 600px)': {
          margin: '16px',
          width: 'calc(100% - 32px)',
          maxWidth: 'none',
        },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiInputBase-root': {
          '@media (max-width: 600px)': {
            fontSize: '0.875rem',
          },
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        '@media (max-width: 600px)': {
          fontSize: '0.75rem',
          height: '24px',
        },
      },
    },
  },
};