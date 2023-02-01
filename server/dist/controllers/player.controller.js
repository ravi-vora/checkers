import { checkJump, findPossibleMoves } from "../helpers/game.helper.js";
import { PrintMessage } from "../helpers/utils.helper.js";
import { validateAuthToken } from "../middlewares/user.middleware.js";
import { Game } from "../models/game.model.js";
import { Player } from "../models/player.model.js";
import { redisClient } from "../services/redis.service.js";
import { playBot1 } from "./bot.controller.js";
export const getPlayerPosssibleMove = (io, socket, payload) => {
    const { token, gameId, position } = payload;
    const errors = {
        gameId: [],
        position: [],
        token: []
    };
    if (!gameId || gameId === "")
        errors.gameId.push("gameId is required");
    if (!token || token === "")
        errors.token.push("token is required");
    if (!position || position === "")
        errors.position.push("position is required.");
    if (errors.gameId.length > 0 ||
        errors.token.length > 0 ||
        errors.position.length > 0) {
        Object.keys(errors).forEach((key) => {
            if (errors[key].length < 1)
                delete errors[key];
        });
        socket.emit('player:move-possible:fail', errors);
    }
    else {
        validateAuthToken(payload.token).then((tokenValidate) => {
            if (!tokenValidate.validate) {
                socket.emit('token:refresh:fail', {
                    token: [`token validate failed: ${tokenValidate.message}`]
                });
                socket.emit('player:move-possible:fail', {
                    token: [`token validate failed: ${tokenValidate.message}`]
                });
            }
            else {
                redisClient.get(gameId).then((game) => {
                    if (game) {
                        game = JSON.parse(game);
                        if (!game.realPlayer[position] && game.botPlayer[position]) {
                            socket.emit('player:move-possible:fail', {
                                position: ["you cant move other players tile"]
                            });
                        }
                        else if (!game.realPlayer[position] && !game.botPlayer[position]) {
                            socket.emit('player:move-possible:fail', {
                                position: ["you cant move blank tiles"]
                            });
                        }
                        else {
                            const moves = findPossibleMoves(position, game, 4, false);
                            socket.emit('player:move-possible:success', moves);
                        }
                    }
                    else {
                        socket.emit('player:move-possible:fail', {
                            general: ["game has been expired"],
                            code: 'GAME_EXPIRED'
                        });
                    }
                });
            }
        }).catch((e) => {
            socket.emit('player:move-possible:fail', {
                general: [e.message]
            });
        });
    }
};
export const movePlayerTile = (io, socket, payload) => {
    var { from, to, token, gameId } = payload;
    var errors = {
        from: [],
        to: [],
        token: [],
        gameId: []
    };
    if (!from || from === '')
        errors.from.push("from is required.");
    if (!to || to === '')
        errors.from.push("to is required.");
    if (!token || token === '')
        errors.from.push("token is required.");
    if (!gameId || gameId === '')
        errors.from.push("gameId is required.");
    if (errors.from.length > 0 ||
        errors.to.length > 0 ||
        errors.token.length > 0 ||
        errors.gameId.length > 0) {
        Object.keys(errors).forEach((key) => {
            if (errors[key].length < 1)
                delete errors[key];
        });
        socket.emit('player:move:fail', errors);
    }
    else {
        redisClient.get(`turn-${gameId}`).then((turn) => {
            if (turn !== '1') {
                socket.emit('player:move:fail', {
                    general: ['it not your turn']
                });
            }
            else {
                validateAuthToken(token).then((tokenValidate) => {
                    if (!tokenValidate.validate) {
                        socket.emit('token:refresh:fail', {
                            token: [`token validate failed: ${tokenValidate.message}`]
                        });
                        socket.emit('player:move:fail', {
                            token: [`token validate failed: ${tokenValidate.message}`]
                        });
                    }
                    else {
                        console.log('getting game...', gameId);
                        redisClient.get(gameId.toString()).then((game) => {
                            game = JSON.parse(game);
                            if (game && (Object.keys(game.botPlayer).length < 1 || Object.keys(game.realPlayer).length < 1)) {
                                redisClient.del(gameId).then(() => {
                                    Game.findById(gameId).populate(['player1', 'player2']).then((game) => {
                                        socket.emit('game:over', game);
                                    }).catch((e) => {
                                        socket.emit('game:over', {});
                                        socket.emit('game:over:fail', {
                                            general: [`failed getting game data : ${e.message}`]
                                        });
                                    });
                                }).catch((e) => {
                                    socket.emit('game:over', game);
                                    socket.emit('game:over:fail', {
                                        general: [`failed deleting game : ${e.message}`]
                                    });
                                });
                                socket.emit('game:over', game);
                            }
                            else if (game) {
                                var updateGame = game;
                                const possibleMove = findPossibleMoves(from, game, 4, false);
                                console.log('possible Move: ', possibleMove.join(','));
                                if (!game.realPlayer[from] && game.botPlayer[from])
                                    errors.from.push('you cant move other player\'s tile');
                                if (!game.realPlayer[from] && !game.botPlayer[from])
                                    errors.from.push('you cant move blank tile');
                                if (!possibleMove.includes(to))
                                    errors.to.push("to doesnt match with possible moves.");
                                if (!game.botPlayer[to] && game.realPlayer[to])
                                    errors.to.push('already allocated by you.');
                                if (game.botPlayer[to] && !game.realPlayer[to])
                                    errors.to.push('already allocated by other player.');
                                if (errors.from.length > 0 ||
                                    errors.to.length > 0) {
                                    Object.keys(errors).forEach((key) => {
                                        if (errors[key].length < 1)
                                            delete errors[key];
                                    });
                                    socket.emit('player:move:fail', errors);
                                }
                                else {
                                    Game.findById(gameId).populate(['player1', 'player2']).then(gameDoc => {
                                        console.log('game expiresAt : ', gameDoc?.expiresAt);
                                        if (!gameDoc || new Date(gameDoc?.expiresAt) < new Date()) {
                                            socket.emit('player:move:fail', {
                                                general: ["Game not found."],
                                                code: "GAME_EXPIRED"
                                            });
                                        }
                                        else {
                                            /**
                                             * check if there is any killing in single move
                                             */
                                            console.log(`checking from : ${from} and to : ${to} `);
                                            const isJump = checkJump(from, to, 2, updateGame);
                                            if (to[1] === '8' && game.realPlayer[from] != 'king') {
                                                updateGame.realPlayer[to] = 'king';
                                                delete updateGame.realPlayer[from];
                                            }
                                            else if (game.realPlayer[from] === 'king') {
                                                updateGame.realPlayer[to] = 'king';
                                                delete updateGame.realPlayer[from];
                                            }
                                            else {
                                                updateGame.realPlayer[to] = 'normal';
                                                delete updateGame.realPlayer[from];
                                            }
                                            if (isJump.jump) {
                                                isJump.killed.forEach((kill) => {
                                                    delete updateGame.botPlayer[kill];
                                                });
                                            }
                                            var update = {
                                                $set: {}
                                            };
                                            update.$set['normal_positions'] = Object.keys(updateGame.realPlayer).filter(position => updateGame.realPlayer[position] === 'normal');
                                            update.$set['king_positions'] = Object.keys(updateGame.realPlayer).filter(position => updateGame.realPlayer[position] === 'king');
                                            if (isJump?.killed?.length > 0) {
                                                update.$set['killed'] = [...(gameDoc.player1.killed), ...isJump.killed];
                                            }
                                            Player.findByIdAndUpdate(gameDoc.player1.realOrNot ? gameDoc.player1.id : gameDoc.player2.id, {
                                                ...update
                                            }, { new: true })
                                                .then((player1) => {
                                                update.$set['normal_positions'] = Object.keys(updateGame.botPlayer).filter(position => updateGame.botPlayer[position] === 'normal');
                                                update.$set['king_positions'] = Object.keys(updateGame.botPlayer).filter(position => updateGame.botPlayer[position] === 'king');
                                                if (isJump?.killed?.length > 0) {
                                                    delete update.$set['killed'];
                                                    update.$set['lose'] = [...(gameDoc.player2.lose), ...isJump.killed];
                                                }
                                                Player.findByIdAndUpdate(gameDoc.player1.realOrNot ? gameDoc.player2.id : gameDoc.player1.id, { ...update }, { new: true }).then((player2) => {
                                                    if (isJump.jump) {
                                                        if (!gameDoc.player1.realOrNot) {
                                                            update.$set['lose'] = [...(gameDoc.player1.realOrNot ? gameDoc.player2.lose : gameDoc.player1.lose), ...isJump.killed];
                                                        }
                                                    }
                                                    redisClient.set(gameId, JSON.stringify(updateGame)).then(() => {
                                                        let response = {
                                                            from: from,
                                                            to: to,
                                                            realPlayer: updateGame.realPlayer,
                                                            botPlayer: updateGame.botPlayer
                                                        };
                                                        if (isJump.jump)
                                                            response['killed'] = isJump.killed;
                                                        /**
                                                         * update player turn on redis server
                                                         */
                                                        redisClient.set(`turn-${gameId}`, 0).then(() => {
                                                            socket.emit('player:move:success', response);
                                                            playBot1(gameId, updateGame, io, socket);
                                                        }).catch((e) => {
                                                            socket.emit('player:move:fail', {
                                                                general: [`failed updation on redis : ${e.message}`],
                                                                code: 'REDIS_FAIL'
                                                            });
                                                        });
                                                    }).catch((e) => {
                                                        socket.emit('player:move:fail', {
                                                            general: [`failed updation on redis : ${e.message}`],
                                                            code: 'REDIS_FAIL'
                                                        });
                                                    });
                                                }).catch((e) => {
                                                    socket.emit('player:move:fail', {
                                                        general: [e.message]
                                                    });
                                                });
                                            })
                                                .catch((e) => {
                                                socket.emit('player:move:fail', {
                                                    general: [e.message]
                                                });
                                            });
                                        }
                                    }).catch((e) => {
                                        PrintMessage('found one -: ' + e.message);
                                        socket.emit('player:move:fail', {
                                            general: ["Game not found."],
                                            code: "GAME_EXPIRED"
                                        });
                                    });
                                }
                            }
                            else {
                                socket.emit('player:move:fail', {
                                    general: ["game not found."]
                                });
                            }
                        }).catch((e) => {
                            console.log('failed getting game', e.message);
                            socket.emit('player:move:fail', {
                                general: ["game has expired."],
                                code: "GAME_EXPIRED"
                            });
                        });
                    }
                }).catch((e) => {
                    console.log('not validated catch');
                    socket.emit('player:move:fail', {
                        general: [`token: ${e.message}`]
                    });
                });
            }
        }).catch((e) => {
            socket.emit('player:move:fail', {
                general: [`failed getting player turn status on redis : ${e.message}`],
                code: 'REDIS_FAIL'
            });
        });
    }
};
//# sourceMappingURL=player.controller.js.map