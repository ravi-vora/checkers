import { Box, Button, Container, Grid, Typography } from '@mui/material'
import React, {useState} from 'react'
import { useNavigate } from 'react-router-dom'
import ShowMessage from './ShowMessage';

const Dashboard = ({socket}) => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  const logout = () => {
    localStorage.removeItem('auth_token');
    navigate('/signin');
  }

  const showMessage = (message) => {
    setOpen(true);
    setMessage(message);
  }

  const playWithBot = () => {
    navigate('/play-with-bot')
  }

  const playWithPlayer = () => {
    showMessage("still in development.")
  }

  return (
    <Container maxWidth="lg">
      <Grid container direction='column' spacing={4}>
        <Grid item>
          <Box 
            mt={2}
            sx={{ 
              display: 'flex', 
              justifyContent: "space-between", 
              alignContent: 'center', 
              alignItems: 'center'
            }}
          >
            <Typography variant='h3'>Checkers</Typography>
            <Button 
              onClick={logout} 
              autoCapitalize="true" 
              variant='contained' 
              size='large' 
              color='error'
              disableElevation
            >
              Logout
            </Button>
          </Box>
        </Grid>
        <Grid item mt={20} textAlign="center">
          <Button
            variant='contained'
            size='large'
            disableElevation
            disableFocusRipple
            onClick={playWithBot}
            autoCapitalize="true"
          >Play with bot</Button>
        </Grid>
        <Grid item textAlign="center">
          <Button
            variant='contained'
            size='large'
            disableElevation
            disableFocusRipple
            onClick={playWithPlayer}
            autoCapitalize="true"
          >Play with player</Button>
        </Grid>
      </Grid>
      <ShowMessage open={open} message={message} setOpen={setOpen} />
    </Container>
  )
}

export default Dashboard