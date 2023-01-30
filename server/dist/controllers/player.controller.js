import { checkJump, findPossibleMoves } from "../helpers/game.helper.js";
import { PrintMessage } from "../helpers/utils.helper.js";
import { validateAuthToken } from "../middlewares/user.middleware.js";
import { Game } from "../models/game.model.js";
import { Player } from "../models/player.model.js";
import { redisClient } from "../services/redis.service.js";
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
                            const moves = findPossibleMoves(position, game, 2, false);
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
// FIXME: redisClient is not responding...
export const movePlayerTile = (io, socket, payload) => {
    const { from, to, token, gameId } = payload;
    const errors = {
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
                redisClient.get(gameId, (game) => {
                    console.log(game);
                    game = JSON.parse(game);
                    var updateGame = game;
                    const possibleMove = findPossibleMoves(from, game, 2, false);
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
                        console.log('reached...2');
                        Object.keys(errors).forEach((key) => {
                            if (errors[key].length < 1)
                                delete errors[key];
                        });
                        socket.emit('player:move:fail', errors);
                    }
                    else {
                        console.log('reached...3');
                        Game.findById(gameId).then(gameDoc => {
                            if (!gameDoc) {
                                socket.emit('player:move:fail', {
                                    general: ["Game not found."],
                                    code: "GAME_EXPIRED"
                                });
                            }
                            else {
                                /**
                                 * check if there is any killing in single move
                                 */
                                const isJump = checkJump(from, to, 2);
                                var update = {
                                    $pull: {},
                                    $push: {}
                                };
                                if (to[1] === '8' && game.realPlayer[from] != 'king') {
                                    update.$pull['normal_positions'] = from;
                                    update.$push['king_positions'] = to;
                                    updateGame.realPlayer[to] = 'king';
                                    delete updateGame.realPlayer[from];
                                }
                                else if (game.realPlayer[from] === 'king') {
                                    update.$pull['king_positions'] = from;
                                    update.$push['king_positions'] = to;
                                    updateGame.realPlayer[to] = 'king';
                                    delete updateGame.realPlayer[from];
                                }
                                else {
                                    update.$pull['normal_positions'] = from;
                                    update.$push['normal_positions'] = to;
                                    updateGame.realPlayer[to] = 'normal';
                                    delete updateGame.realPlayer[from];
                                }
                                if (isJump.jump) {
                                    update.$push['killed'] = isJump.killed;
                                }
                                Player.findByIdAndUpdate(gameDoc.player1, { ...update }, { new: true })
                                    .then((player1) => {
                                    console.log('player1', player1);
                                    var updateBot = {
                                        $push: {},
                                        $pull: {}
                                    };
                                    if (isJump.jump) {
                                        updateBot.$push['lose'] = isJump.killed;
                                        updateBot.$pull['normal_positions'] = isJump.killed;
                                        updateBot.$pull['king_positions'] = isJump.killed;
                                    }
                                    Player.findByIdAndUpdate(player1.oponent, { ...updateBot }, { new: true }).then((player2) => {
                                        console.log('player2', player2);
                                        redisClient.set(gameId, JSON.stringify(updateGame)).then(() => {
                                            let response = {
                                                from: from,
                                                to: to,
                                                realPlayer: updateGame.realPlayer,
                                                botPlayer: updateGame.botPlayer
                                            };
                                            if (isJump.jump)
                                                response['killed'] = isJump.killed;
                                            socket.emit('player:move:success', response);
                                        }).catch((e) => {
                                            socket.emit('player:move:fail', {
                                                general: [`failed updation on redis : ${e.message}`]
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
                            PrintMessage(e.message);
                            socket.emit('player:move:fail', {
                                general: ["Game not found."],
                                code: "GAME_EXPIRED"
                            });
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
};
//# sourceMappingURL=player.controller.js.map