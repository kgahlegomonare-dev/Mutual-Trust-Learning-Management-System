import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import ForumIcon from '@mui/icons-material/Forum';
import MapsUgcIcon from '@mui/icons-material/MapsUgc';
import { useAuth } from '../../hooks/useAuth';

export default function DiscussionForums() {
  const { authUser } = useAuth();
  const userRole = authUser?.user_role?.toLowerCase() || 'learner';

  const mockChannels = [
    { id: 1, title: 'Grade 12 Physics: Mechanics Help', posts: 14, lastActive: '20 mins ago', category: 'Physical Sciences' },
    { id: 2, title: 'General Center Announcements & Queries', posts: 5, lastActive: '2 hours ago', category: 'General' },
  ];

  return (
    <Box sx={{ p: 1, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Discussion Forums</Typography>
          <Typography variant="body2" color="text.secondary">
            Connect with peers, ask academic questions, and engage with educators across subject spaces.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<MapsUgcIcon />} sx={{ textTransform: 'none', borderRadius: '8px' }}>
          New Discussion Thread
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {mockChannels.map((channel) => (
              <Card key={channel.id} variant="outlined" sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: '50%', color: 'primary.main', display: 'flex' }}>
                    <ForumIcon />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
                      {channel.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Stream: {channel.category} • Active: {channel.lastActive}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', minWidth: '80px' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{channel.posts}</Typography>
                    <Typography variant="caption" color="text.secondary">replies</Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Community Guidelines</Typography>
            <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1 }}>
              • Maintain academic integrity and respect.
            </Typography>
            <Typography variant="caption" color="text.secondary" component="p">
              • Direct specific administrative or billing questions to your local Center Manager.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}