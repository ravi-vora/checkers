import { Button, Container, Grid, TextField, Typography } from '@mui/material';
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import ShowMessage from './ShowMessage';

const SigninComponent = ({socket}) => {
    const navigate = useNavigate();
    const [errors, setErrors] = useState({ email: [], password: [] });
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');

    React.useEffect(() => {
        socket.on('connect', () => {
            socket.on('token:refresh:success', (refreshedToken) => {
              if (refreshedToken?.token) localStorage.setItem('auth_token', refreshedToken?.token);
              navigate('/dashboard');
            })
    
            socket.on('token:refresh:fail', (failToken) => {
              navigate('/');
              localStorage.removeItem('auth_token');
            })
            
            socket.emit('token:refresh', {
              token: localStorage.getItem('auth_token')
            })
        })
    }, [navigate, socket])

    const showMessage = (message) => {
        setOpen(true);
        setMessage(message);
    }

    const submitSignup = (e) => {
        e.preventDefault();
        if ( socket.connected ) {
            socket.on('user:login:success', (user) => {
                if (user?.token) localStorage.setItem('auth_token', user?.token);
                navigate('/dashboard')
            })
    
            socket.on('user:login:fail', (failUser) => {
                if(failUser?.general) showMessage(failUser?.general[0]);
                setErrors(failUser);
            })

            socket.emit('user:login', {
                email: e.target.elements.email.value,
                password: e.target.elements.password.value
            })
        } else {
            console.log('socket is not connected.')
        }
    }

    return (
        <Container maxWidth="sm" style={{
            paddingTop: "15vh"
        }}>
            <Typography variant='h4' textAlign="center" mb={3} fontWeight='300' sx={{ userSelect: 'none', textTransform: 'uppercase', fontWeight: '200', fontFamily: "'Poppins', sans-serif" }}>
                Signin
            </Typography>
            <form action="#" onSubmit={submitSignup}>
                <Grid container direction="column" spacing={3}>
                    <Grid item>
                        <TextField 
                            type="text"
                            name="email"
                            variant='outlined'
                            label="Email address"
                            placeholder='Enter a valid email address'
                            fullWidth
                            id='email'
                            size='small'
                            autoComplete='off'
                            className='input'
                            error={errors.email && Array.isArray(errors.email) && errors.email.length > 0}
                            helperText={errors.email && Array.isArray(errors.email) && errors.email.length > 0 ? errors.email[0] : ''}
                        />
                    </Grid>
                    <Grid item>
                        <TextField 
                            type="password"
                            name="password"
                            variant='outlined'
                            label="Password"
                            placeholder='Enter a strong password'
                            fullWidth
                            id='password'
                            size='small'
                            autoComplete='off'
                            className='input'
                            error={errors.password && Array.isArray(errors.password) && errors.password.length > 0}
                            helperText={errors.password && Array.isArray(errors.password) && errors.password.length > 0 ? errors.password[0] : ''}
                        />
                    </Grid>
                    <Grid item textAlign="right">
                        <Link to='/' style={{ textDecoration: 'none', userSelect: 'none' }}>
                            <Typography variant='title'>
                                don't have any account?
                            </Typography>
                        </Link>
                    </Grid>
                    <Grid item>
                        <Button
                            type='submit'
                            variant='contained'
                            autoCapitalize='true'
                            fullWidth
                            disableElevation
                            disableFocusRipple
                        >
                            Signin
                        </Button>
                    </Grid>
                </Grid>
            </form>
            <ShowMessage open={open} message={message} setOpen={setOpen} />
        </Container>
    )
}

export default SigninComponent;