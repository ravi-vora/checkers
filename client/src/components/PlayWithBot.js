import { Container, Grid, Paper } from '@mui/material';
import React from 'react';
import ShowMessage from './ShowMessage';

const PlayWithBot = ({ socket }) => {
    const [open, setOpen] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const [gameBoard, setGameBoard] = React.useState(null);
    const [playerTiles, setPlayerTiles] = React.useState(null);
    const [botTiles, setBotTiles] = React.useState(null);
    const [playerTargeted, setPlayerTargeted] = React.useState(null);
    const [possibleMove, setPossibleMove] = React.useState([]);

    const showMessage = (message) => {
        setOpen(true);
        setMessage(message);
    }

    const positionClick = (e, position) => {
        e.stopPropagation();

        if(socket.connected) {
            if(playerTiles[position] && !possibleMove.includes(position)) {
                setPlayerTargeted(position)
                socket.emit('player:move-possible', { 
                    position: position,
                    token: localStorage.getItem('auth_token'),
                    gameId: localStorage.getItem('gameId')
                })
            } else {
                setPlayerTargeted(null)
                setPossibleMove([])
                socket.emit('player:move', { 
                    from: playerTargeted, 
                    to: position,
                    token: localStorage.getItem('auth_token'),
                    gameId: localStorage.getItem('gameId')
                })
            }
        } else {
            showMessage(true, "Lost internet connectivity");
        }
    }

    React.useEffect(() => {
        function initGameWithBot() {
            socket.on('game:over', (game) => {
                console.log(game)
                localStorage.removeItem('gameId');
            })

            socket.on('bot:move:success', (botMoved) => {
                console.log('botmoved', botMoved);
                setBotTiles(botMoved?.botPlayer);
                setPlayerTiles(botMoved?.realPlayer);
                setPossibleMove([])
                setPlayerTargeted(null)
                if (botMoved?.killed) {
                    document.getElementById(botMoved.killed).innerHTML = ''
                }
            })

            socket.on('bot:move:fail', (botMoveFail) => {
                console.log('botmoved failed', botMoveFail);
                console.log(botMoveFail);
            })

            socket.on('player:turn', (game) => {
                console.log('turn');
                setPossibleMove([])
            })


            socket.on('player:move:success', (playerMoved) => {
                console.log(playerMoved)
                setPlayerTiles(playerMoved?.realPlayer);
                setPlayerTargeted(null)
                document.querySelectorAll('.position').forEach(e => {
                    e.style.opacity = '1';
                    
                })
            })
            socket.on('player:move:fail', (moveFail) => {
                setPlayerTargeted(null)
                console.log(moveFail)
            })

            socket.on('player:move-possible:success', (move) => {
                console.log(move)
                setPossibleMove(move);
                document.querySelectorAll('.position').forEach(e => {
                    if (Array.isArray(move) && move.includes(e.id)) {
                        e.style.opacity = '0.1';
                    } else {
                        e.style.opacity = '1'
                    }
                })
            })

            socket.on('player:move-possible:fail', (moveFail) => {
                console.log(moveFail)
            })
            
            socket.on('game:create-bot:fail', (gameFailed) => {
                showMessage(gameFailed?.general[0]);
                console.log(gameFailed);
            })
            socket.on('game:create-bot:success', (game) => {
                localStorage.setItem('gameId', game?.gameId);
                setPlayerTiles(game?.realPlayer)
                setBotTiles(game?.botPlayer)
                setGameBoard(game?.board)
            })
            socket.emit('game:create-bot', {
                token: localStorage.getItem('auth_token')
            });
        }
        
        socket.on('connect', () => {
            initGameWithBot()
        })
        return () => {
            if (socket.connected) initGameWithBot();
        }
    }, [socket])

    return (
        <Container sx={{
            paddingTop: "10px",
        }}>
            <Grid sx={{
                backgroundColor: "#E8D2A6",
                paddingBottom: '20px'
            }} maxWidth="950px" maxHeight="950px" container spacing={0}>
                {gameBoard && Object.keys(gameBoard).map((position) => (
                    <Grid item key={position}>
                        <Paper 
                            className="position"
                            variant="outlined" 
                            style={{
                                width: '112.5px',
                                height: '112.5px',
                                backgroundColor: `${gameBoard[position]}`,
                                display: 'flex',
                                alignItems: 'center', 
                                justifyContent: 'center',
                                color: 'white',
                                userSelect: 'none',
                                cursor: 'pointer'
                            }} 
                            onClick={(e) => positionClick(e, position)} 
                            square 
                            id={position} 
                        >
                            {playerTiles[position] ? <img src="/images/player_tile.png" alt={position} /> : ''}
                            {botTiles[position] ? <img src="/images/bot_tile.png" alt={position} /> : ''}
                        </Paper>
                    </Grid>
                ))}
            </Grid>
            <ShowMessage open={open} message={message} setOpen={setOpen} />
        </Container>
    )
}

export default PlayWithBot