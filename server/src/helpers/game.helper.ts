import { vertical__tiles, horizontal__tiles, RedisGameBoard, GameBoard, PositionType} from '../config/game.config.js'

export const directionConfig = {
    leftForward: { forwardOrBack: false, leftOrRight: false },
    rightForward: { forwardOrBack: false, leftOrRight: true },
    rightBack: { forwardOrBack: true, leftOrRight: true },
    leftBack: { forwardOrBack: true, leftOrRight: false }
}

export const validatePosition = (position: string) => {
    try {
        const firstLetter : string = position[0];
        const secondLetter : string = position[1];

        if(!horizontal__tiles.includes(firstLetter) || !vertical__tiles.includes(secondLetter)) {
            return false;
        }
        return true;
    } catch(e) {
        return false;
    }
}

export const findCross = ({
        position, 
        forwardOrBack = false, 
        leftOrRight = false, 
        steps = 1
    } : {
        position: string,
        forwardOrBack?: boolean,
        leftOrRight?: boolean,
        steps?: number
    }) : string | null => {
    if (!validatePosition(position)) throw new Error(`position is not valid : ${position}`);
    const firstLetter : string = position[0];
    const secondLetter : string = position[1];

    const asciiValueOfFirst = firstLetter.charCodeAt(0);
    const numberValueOfSecond = parseInt(secondLetter);

    if(leftOrRight) {
        if (!forwardOrBack) {
            if(!vertical__tiles.includes((numberValueOfSecond + steps).toString()) || !horizontal__tiles.includes(String.fromCharCode(asciiValueOfFirst - steps))) {
                return null
            } else {
                return String.fromCharCode(asciiValueOfFirst - steps) + (numberValueOfSecond + steps).toString()
            }
        }
        else {
            if(!vertical__tiles.includes((numberValueOfSecond - steps).toString()) || !horizontal__tiles.includes(String.fromCharCode(asciiValueOfFirst - steps))) {
                return null
            } else {
                return String.fromCharCode(asciiValueOfFirst - steps) + (numberValueOfSecond - steps).toString()
            }
        }
    } else {
        if (!forwardOrBack) {
            if(!vertical__tiles.includes((numberValueOfSecond + steps).toString()) || !horizontal__tiles.includes(String.fromCharCode(asciiValueOfFirst + steps))) {
                return null
            } else {
                return String.fromCharCode(asciiValueOfFirst + steps) + (numberValueOfSecond + steps).toString()
            }
        }
        else {
            if(!vertical__tiles.includes((numberValueOfSecond - steps).toString()) || !horizontal__tiles.includes(String.fromCharCode(asciiValueOfFirst + steps))) {
                return null
            } else {
                return String.fromCharCode(asciiValueOfFirst + steps) + (numberValueOfSecond - steps).toString()
            }
        }
    }
}

export const createGameBoard = () : GameBoard => {
    var board = {};
    var player1 = {};
    var player2 = {};

    vertical__tiles.forEach((v, v_index) => {
        let black = v_index%2 == 0 ? true : false;
        horizontal__tiles.forEach((h, h_index) => {
            board[h + v] = black ? "#FF6E31" : "#F0997D";

            if( v_index >= vertical__tiles.length - 3 ) {
                if(!black) { player1[h + v] = "normal"; }
            } else if( v_index <= 2 ) {
                if(!black) { player2[h + v] = "normal"; }
            }

            black = !black;
        })
    })

    return {
        board,
        player1,
        player2
    }
}

export const addMinutes = (date: Date, minutes: number) : Date => {
    return new Date(date.getTime() + minutes*60000);
}

export const findPossibleMoves = (position: string, game: RedisGameBoard, maximum: number, realOrBot: boolean) : string[] => {
    if ( !realOrBot && game.realPlayer[position] ) {
        var possible = []
        var findKillPositions : string[] = [];
        var findPossiblePositions : string[] = [];

        let kills : null | string[] = null;
        if ( game.realPlayer[position] === 'normal' ) {
            kills = findKillMoves(position, game, 1, false);
        } else if ( game.realPlayer[position] === 'king' ) {
            kills = findKillMoves(position, game, 2, false);
        } else {
            throw new Error("unknown position_type")
        }

        if(kills) findKillPositions.push(...kills);

        /**
         * if there is any kill possible -> push it to possible
         */
        if ( findKillPositions.length > 0 ) {
            possible.push(...findKillPositions);
        }

        /**
         * if we didn't find maximum number of kills
         */
        if ( possible.length < maximum ) {
            let possibleMove : null | string[] = null;
            if ( game.realPlayer[position] === 'normal' ) {
                possibleMove = findAnyPossibleMoves(position, game, 1, false);
            } else if ( game.realPlayer[position] === 'king' ) {
                possibleMove = findAnyPossibleMoves(position, game, 2);
            } else {
                throw new Error("unknown position_type")
            }

            if ( possibleMove ) findPossiblePositions.push(...possibleMove);

            /**
             * if there is any kill possible -> push it to possible
             */
            if ( findPossiblePositions.length > 0 ) {
                possible.push(...findPossiblePositions);
            }
        }

        return possible.filter((_, i) => i < maximum);
    } else {
        throw new Error("invalid player position");
    }
}


export const findKillMoves = (position: string, game: RedisGameBoard, position_type: PositionType, forwardOrBack?: boolean) : string[] => {
    var available = []
    if (position_type === 1) {
        if (!forwardOrBack) {
            const rightCrossSecond = findCross({ position: position, forwardOrBack: false, leftOrRight: true, steps: 2 })
            const leftCrossSecond = findCross({ position: position, forwardOrBack: false, leftOrRight: false, steps: 2 })


            if ( rightCrossSecond && !game.realPlayer[rightCrossSecond] && !game.botPlayer[rightCrossSecond] ) {
                const rightCross = findCross({ position: position, forwardOrBack: false, leftOrRight: true, steps: 1 })

                if ( rightCross && game.botPlayer[rightCross] ) available.push(rightCrossSecond);
            }

            if ( leftCrossSecond && !game.realPlayer[leftCrossSecond] && !game.botPlayer[leftCrossSecond] ) {
                const leftCross = findCross({ position: position, forwardOrBack: false, leftOrRight: false, steps: 1 })

                if ( leftCross && game.botPlayer[leftCross] ) available.push(leftCrossSecond);
            }
        } else {
            const rightCrossSecond = findCross({ position: position, forwardOrBack: true, leftOrRight: true, steps: 2 })
            const leftCrossSecond = findCross({ position: position, forwardOrBack: true, leftOrRight: false, steps: 2 })


            if ( rightCrossSecond && !game.realPlayer[rightCrossSecond] && !game.botPlayer[rightCrossSecond] ) {
                const rightCross = findCross({ position: position, forwardOrBack: true, leftOrRight: true, steps: 1 })

                if ( rightCross && game.botPlayer[rightCross] ) available.push(rightCrossSecond);
            }

            if ( leftCrossSecond && !game.realPlayer[leftCrossSecond] && !game.botPlayer[leftCrossSecond] ) {
                const leftCross = findCross({ position: position, forwardOrBack: true, leftOrRight: false, steps: 1 })

                if ( leftCross && game.botPlayer[leftCross] ) available.push(leftCrossSecond);
            }
        }
    } else if (position_type === 2) {
        const rightForwardCrossSecond = findCross({ position: position, forwardOrBack: false, leftOrRight: true, steps: 2 })
        const leftForwardCrossSecond = findCross({ position: position, forwardOrBack: false, leftOrRight: false, steps: 2 })
        const leftBackCrossSecond = findCross({ position: position, forwardOrBack: true, leftOrRight: false, steps: 2 })
        const rightBackCrossSecond = findCross({ position: position, forwardOrBack: true, leftOrRight: true, steps: 2 })


        if ( rightForwardCrossSecond && !game.realPlayer[rightForwardCrossSecond] && !game.botPlayer[rightForwardCrossSecond] ) {
            const rightForwardCross = findCross({ position: position, forwardOrBack: false, leftOrRight: true, steps: 1 })

            if ( rightForwardCross && game.botPlayer[rightForwardCross] ) available.push(rightForwardCrossSecond);
        }

        if ( leftForwardCrossSecond && !game.realPlayer[leftForwardCrossSecond] && !game.botPlayer[leftForwardCrossSecond] ) {
            const leftForwardCross = findCross({ position: position, forwardOrBack: false, leftOrRight: false, steps: 1 })

            if ( leftForwardCross && game.botPlayer[leftForwardCross] ) available.push(leftForwardCrossSecond);
        }

        if ( leftBackCrossSecond && !game.realPlayer[leftBackCrossSecond] && !game.botPlayer[leftBackCrossSecond] ) {
            const leftBackCross = findCross({ position: position, forwardOrBack: true, leftOrRight: false, steps: 1 })

            if ( leftBackCross && game.botPlayer[leftBackCross] ) available.push(leftBackCrossSecond);
        }

        if ( rightBackCrossSecond && !game.realPlayer[rightBackCrossSecond] && !game.botPlayer[rightBackCrossSecond] ) {
            const rightBackCross = findCross({ position: position, forwardOrBack: true, leftOrRight: true, steps: 1 })

            if ( rightBackCross && game.botPlayer[rightBackCross] ) available.push(rightBackCrossSecond);
        }
    } else {
        throw new Error('position_type is invalid')
    }
    return available;
}

export const findAnyPossibleMoves = (position: string, game: RedisGameBoard, position_type: PositionType, forwardOrBack?: boolean) => {
    var available = []
    if (position_type === 1) {
        if (!forwardOrBack) {
            const rightCross = findCross({ position: position, forwardOrBack: false, leftOrRight: true, steps: 1 })
            const leftCross = findCross({ position: position, forwardOrBack: false, leftOrRight: false, steps: 1 })


            if ( rightCross && !game.realPlayer[rightCross] && !game.botPlayer[rightCross] ) {
                available.push(rightCross)
            }

            if ( leftCross && !game.realPlayer[leftCross] && !game.botPlayer[leftCross] ) {
                available.push(leftCross);
            }
        } else {
            const rightCross = findCross({ position: position, forwardOrBack: true, leftOrRight: true, steps: 1 })
            const leftCross = findCross({ position: position, forwardOrBack: true, leftOrRight: false, steps: 1 })


            if ( rightCross && !game.realPlayer[rightCross] && !game.botPlayer[rightCross] ) {
                available.push(rightCross);
            }

            if ( leftCross && !game.realPlayer[leftCross] && !game.botPlayer[leftCross] ) {
                available.push(leftCross);
            }
        }
    } else if (position_type === 2) {
        const rightForwardCross = findCross({ position: position, forwardOrBack: false, leftOrRight: true, steps: 1 })
        const leftForwardCross = findCross({ position: position, forwardOrBack: false, leftOrRight: false, steps: 1 })
        const leftBackCross = findCross({ position: position, forwardOrBack: true, leftOrRight: false, steps: 1 })
        const rightBackCross = findCross({ position: position, forwardOrBack: true, leftOrRight: true, steps: 1 })


        if ( rightForwardCross && !game.realPlayer[rightForwardCross] && !game.botPlayer[rightForwardCross] ) {
            available.push(rightForwardCross)
        }

        if ( leftForwardCross && !game.realPlayer[leftForwardCross] && !game.botPlayer[leftForwardCross] ) {
            available.push(leftForwardCross)
        }

        if ( leftBackCross && !game.realPlayer[leftBackCross] && !game.botPlayer[leftBackCross] ) {
            available.push(leftBackCross)
        }

        if ( rightBackCross && !game.realPlayer[rightBackCross] && !game.botPlayer[rightBackCross] ) {
            available.push(rightBackCross)
        }
    } else {
        throw new Error('position_type is invalid')
    }
    return available;
}

export const checkJump = (from: string, to: string, numberOfPaths: number) => {
    var killed = [];
    Object.keys(directionConfig).every((direction, d_index) => {
        if (d_index < numberOfPaths) return false;
        
        let check = numberOfPaths;
        while (check) {
            --check;
            const makeJump = findCross({ ...directionConfig[direction], step: 2, position: from });
            
            if(makeJump === to) {
                const kill = findCross({ ...directionConfig[direction], step: 1, position: from });
                killed.push(kill);
            }
            from = makeJump;
        }

        return true;
    });

    if (killed.length > 0) return { jump: true, killed: killed }
    else return { jump: false }
}

export const checkSaftyBeforeMove = (currentPosition, movePosition, game: any, role: string) => {
    const frontLeft = findCross({ position: movePosition, forwardOrBack: true, leftOrRight: true, steps: 1 });
    const backRight = findCross({ position: movePosition, forwardOrBack: false, leftOrRight: false, steps: 1 });

    const frontRight = findCross({ position: movePosition, forwardOrBack: true, leftOrRight: false, steps: 1 });
    const backLeft = findCross({ position: movePosition, forwardOrBack: false, leftOrRight: true, steps: 1 });
    if ( frontLeft && game.real_player[frontLeft] ) {
        if ( backRight && backRight === currentPosition) {
            return false;
        } else if(backRight && !game.bot_player[backRight] && !game.real_player[backRight]) {
            return false;
        }
    } else if ( frontRight && game.real_player[frontRight]) {
        if ( backLeft && backLeft === currentPosition) {
            return false;
        } else if( backLeft && !game.real_player[backLeft] && !game.bot_player[backLeft]) {
            return false;
        }
    }
    return true;
}