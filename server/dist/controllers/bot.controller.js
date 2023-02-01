import { checkJump, checkSaftyBeforeMove, findAnyPossibleMoves, findKillMoves, randomIntFromInterval } from "../helpers/game.helper.js";
import { Game } from "../models/game.model.js";
import { Player } from "../models/player.model.js";
import { redisClient } from "../services/redis.service.js";
export const playBot1 = (gameId, game, io, socket) => {
    if (game && Object.keys(game.botPlayer).length < 1 || Object.keys(game.realPlayer).length < 1) {
        Game.findById(gameId).populate(['player1', 'player2']).then((game) => {
            socket.emit('game:over', game);
        }).catch((e) => {
            socket.emit('game:over', {
                general: [`failed gatting game data : ${e.message}`]
            });
        });
    }
    else {
        redisClient.get(`turn-${gameId}`).then(turn => {
            if (turn !== '0') {
                socket.emit('bot:move:fail', {
                    general: ['bot cant move']
                });
            }
            else {
                var choosedFinalMove = {
                    from: null,
                    to: [],
                    kill: []
                };
                var choosedMove = {
                    from: null,
                    to: [],
                    kill: []
                };
                var allPossiblekillMoves = [];
                /**
                 * find all kill moves if there is any then checking -> is it safe or not
                 */
                Object.keys(game.botPlayer).every((position) => {
                    let killMoves = [];
                    if (game.botPlayer[position] === 'normal') {
                        killMoves = findKillMoves(position, game, 1, true, true);
                    }
                    else if (game.botPlayer[position] === 'king') {
                        killMoves = findKillMoves(position, game, 2, true, true);
                    }
                    else {
                        throw new Error("invalid position found in logic");
                    }
                    if (killMoves.length > 0) {
                        console.log('found kill moves: ', killMoves);
                        allPossiblekillMoves.push(...killMoves);
                        killMoves.every((killMove) => {
                            var isPossitionSafe = checkSaftyBeforeMove(position, killMove, game, game.botPlayer[position]);
                            console.log('safty of kill move : ', isPossitionSafe);
                            if (isPossitionSafe) {
                                choosedMove.from = position,
                                    choosedMove.to = [killMove];
                                var isJump = checkJump(position, killMove, 2, updateGame);
                                if (isJump.jump) {
                                    console.log('killed positions : ', isJump.killed);
                                    choosedMove.kill.push(...isJump.killed);
                                }
                                return false;
                            }
                            else {
                                return true;
                            }
                        });
                    }
                    if (choosedMove.from && choosedMove.to.length > 0)
                        return false;
                    else
                        return true;
                });
                console.log('choosed move : ', choosedMove);
                /**
                 * if move is not safe we find normal random move
                 */
                if (allPossiblekillMoves.length < 1 && !choosedMove.from && choosedMove.to.length < 1) {
                    console.log('looking for any possible move');
                    var anyPossibleMoves = [];
                    /**
                     * collect all possible
                     */
                    Object.keys(game.botPlayer).every((position) => {
                        const possibleMove = findAnyPossibleMoves(position, game, game.botPlayer[position] === 'normal' ? 1 : 2, true);
                        console.log('possible', possibleMove);
                        if (possibleMove.length > 0) {
                            anyPossibleMoves.push({
                                from: position,
                                to: possibleMove
                            });
                        }
                        return true;
                    });
                    /**
                     * choose any random move
                     */
                    const randomNumber = randomIntFromInterval(0, anyPossibleMoves.length - 1);
                    choosedFinalMove.from = anyPossibleMoves[randomNumber].from;
                    choosedFinalMove.to = [...anyPossibleMoves[randomNumber].to];
                    console.log('choosedFinalMove 1', choosedFinalMove);
                }
                else {
                    console.log('kill selected : ', choosedMove);
                    choosedFinalMove = choosedMove;
                }
                if (!choosedFinalMove.from && choosedFinalMove.to.length < 1) {
                    throw new Error("bot didnt find any possible move, logic is not right!");
                }
                else {
                    console.log('choosedFinalMove 2', choosedFinalMove);
                    var updateGame = game;
                    const randomNumber = randomIntFromInterval(0, choosedFinalMove.to.length - 1);
                    console.log('to : ', choosedFinalMove.to);
                    console.log('random number', randomNumber);
                    let to = choosedFinalMove.to[randomNumber];
                    if (to[1] === '1' && updateGame.botPlayer[choosedFinalMove.from] !== 'king') {
                        updateGame.botPlayer[to] = 'king';
                    }
                    else {
                        updateGame.botPlayer[to] = updateGame.botPlayer[choosedFinalMove.from];
                    }
                    if (choosedFinalMove.kill.length > 0) {
                        console.log('killing of realPlayer');
                        choosedFinalMove.kill.forEach(killed => {
                            delete updateGame.realPlayer[killed];
                        });
                    }
                    delete updateGame.botPlayer[choosedFinalMove.from];
                    redisClient.set(gameId, JSON.stringify(updateGame)).then(() => {
                        Game.findById(gameId).populate(['player1', 'player2']).then(gameDoc => {
                            console.log('game expiration : ', new Date(gameDoc?.expiresAt) > new Date());
                            console.log('game expiration status : ', new Date(gameDoc?.expiresAt), new Date());
                            if (gameDoc && new Date(gameDoc?.expiresAt) > new Date()) {
                                console.log('game is not over yet...');
                                /**
                                 * update real player positions
                                 */
                                var update = {
                                    $set: {}
                                };
                                update.$set['normal_positions'] = Object.keys(updateGame.realPlayer).filter(position => updateGame.realPlayer[position] === 'normal');
                                update.$set['king_positions'] = Object.keys(updateGame.realPlayer).filter(position => updateGame.realPlayer[position] === 'king');
                                if (choosedFinalMove?.kill?.length > 0) {
                                    update.$set['lose'] = [...(gameDoc.player1.lose), ...choosedFinalMove.kill];
                                }
                                console.log('player 1 : ', JSON.stringify(update));
                                Player.findByIdAndUpdate(gameDoc.player1.realOrNot ? gameDoc.player1.id : gameDoc.player2.id, {
                                    ...update
                                }, { new: true }).then((player1) => {
                                    update.$set['normal_positions'] = Object.keys(updateGame.botPlayer).filter(position => updateGame.botPlayer[position] === 'normal');
                                    update.$set['king_positions'] = Object.keys(updateGame.botPlayer).filter(position => updateGame.botPlayer[position] === 'king');
                                    if (choosedFinalMove?.kill?.length > 0) {
                                        delete update.$set['lose'];
                                        update.$set['killed'] = [...(gameDoc.player2.killed), ...choosedFinalMove.kill];
                                    }
                                    /**
                                     * update bot player positions
                                     */
                                    console.log('player 2 : ', JSON.stringify(update));
                                    Player.findByIdAndUpdate(gameDoc.player1.realOrNot ? gameDoc.player2.id : gameDoc.player1.id, {
                                        ...update
                                    }, { new: true }).then((player2) => {
                                        /**
                                         * update game on redis server
                                         */
                                        redisClient.set(gameId, JSON.stringify(updateGame)).then(() => {
                                            var response = {
                                                from: choosedFinalMove.from,
                                                to: to,
                                                realPlayer: updateGame.realPlayer,
                                                botPlayer: updateGame.botPlayer
                                            };
                                            if (choosedFinalMove.kill.length > 0) {
                                                response['kill'] = choosedFinalMove.kill;
                                            }
                                            redisClient.set(`turn-${gameId}`, 1).then((result) => {
                                                console.log('player turn updated : ', result);
                                                socket.emit('bot:move:success', response);
                                                socket.emit('player:turn', {
                                                    gameId: gameId,
                                                    game: updateGame
                                                });
                                                if (updateGame && (Object.keys(updateGame.botPlayer).length < 1 || Object.keys(updateGame.realPlayer).length < 1)) {
                                                    Game.findById(gameId).populate(['player1', 'player2']).then((game) => {
                                                        socket.emit('game:over', game);
                                                    }).catch((e) => {
                                                        socket.emit('game:over', {
                                                            general: [`failed gatting game data : ${e.message}`]
                                                        });
                                                    });
                                                }
                                            }).catch((e) => {
                                                socket.emit('bot:move:fail', {
                                                    general: [`failed updating player turn : ${e.message}`]
                                                });
                                            });
                                        }).catch((e) => {
                                            socket.emit('bot:move:fail', {
                                                general: [`updation on redis server ${e.message}`]
                                            });
                                        });
                                    }).catch((e) => {
                                        socket.emit('bot:move:fail', {
                                            general: [e.message]
                                        });
                                    });
                                }).catch((e) => {
                                    socket.emit('bot:move:fail', {
                                        general: [e.message]
                                    });
                                });
                            }
                            else {
                                socket.emit('bot:move:fail', {
                                    general: ["game has been expired."],
                                    code: "GAME_EXPIRED"
                                });
                            }
                        }).catch((e) => {
                            socket.emit('bot:move:fail', {
                                general: ["Game not found."],
                                code: "GAME_EXPIRED"
                            });
                        });
                    }).catch((e) => {
                        socket.emit('bot:move:fail', {
                            general: ["failed updating game."],
                            code: "GAME_EXPIRED"
                        });
                    });
                }
            }
        }).catch((e) => {
            socket.emit('bot:move:fail', {
                general: [`failed getting player turn : ${e.message}`]
            });
        });
    }
};
//# sourceMappingURL=bot.controller.js.map