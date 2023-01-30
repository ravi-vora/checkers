import React from 'react';
import { useNavigate } from "react-router-dom";

const GuardedRoute = ({component: Component, socket, ...rest}) => {
    const navigate = useNavigate();
    React.useEffect(() => {
        socket.on('connect', () => {
            socket.on('token:refresh:success', (refreshedToken) => {
              if (refreshedToken?.token) localStorage.setItem('auth_token', refreshedToken?.token);
            })
    
            socket.on('token:refresh:fail', (failToken) => {
              navigate('/');
            })
            
            socket.emit('token:refresh', {
              token: localStorage.getItem('auth_token')
            })
        })
    }, [navigate, socket])

    return <Component socket={socket} {...rest} />
}

export default GuardedRoute