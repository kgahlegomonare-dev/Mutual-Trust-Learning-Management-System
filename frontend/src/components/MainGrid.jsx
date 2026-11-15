
import React from 'react';
import Box from '@mui/material/Box';
import Copyright from '../internals/components/Copyright';
import { pageRegistry } from '../utils/pageRegistry';

export default function MainGrid({ currentView = 'Overview' }) {
  const TargetPageFunction = pageRegistry[currentView];

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, pt: 2 }}>
      <Box sx={{ width: '100%', mb: 4 }}>
        {TargetPageFunction ? TargetPageFunction() : <div>Page not found in registry.</div>}
      </Box>
      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}