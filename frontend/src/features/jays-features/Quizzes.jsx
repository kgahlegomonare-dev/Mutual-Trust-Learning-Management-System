import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import TimerIcon from '@mui/icons-material/Timer';
import { useAuth } from '../../hooks/useAuth';

export default function Quizzes() {
  const { authUser } = useAuth();
  const isLearner = authUser?.user_role?.toLowerCase() === 'learner';

  const mockQuizzes = [
    { id: 1, title: 'Algebra Foundation Check', subject: 'Mathematics', duration: '20 mins', totalQuestions: 10, status: 'Active' },
    { id: 2, title: 'Chemical Bonding Fundamentals', subject: 'Physical Sciences', duration: '30 mins', totalQuestions: 15, status: 'Closed' }
  ];

  return (
    <Box sx={{ p: 1, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Quizzes Hub</Typography>
          <Typography variant="body2" color="text.secondary">Formative evaluation parameters, online mock sessions, and feedback processing logs.</Typography>
        </Box>
        {!isLearner && (
          <Button variant="contained" sx={{ textTransform: 'none', borderRadius: '8px' }}>
            Build New Quiz
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {mockQuizzes.map((quiz) => (
          <Grid item xs={12} sm={6} key={quiz.id}>
            <Card variant="outlined" sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{quiz.title}</Typography>
                  <Chip 
                    label={quiz.status} 
                    size="small" 
                    color={quiz.status === 'Active' ? 'success' : 'default'} 
                    variant="soft" 
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Subject Track: {quiz.subject} • Total Content Items: {quiz.totalQuestions}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                  <TimerIcon fontSize="inherit" />
                  <Typography variant="caption">Time Limit: {quiz.duration}</Typography>
                </Box>
              </CardContent>
              <CardActions sx={{ justify: 'flex-end', p: 2, pt: 0 }}>
                <Button size="small" variant="contained" fullWidth disableElevation sx={{ textTransform: 'none', borderRadius: '6px' }}>
                  {isLearner ? 'Launch Session Check' : 'Analyze Submissions'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}