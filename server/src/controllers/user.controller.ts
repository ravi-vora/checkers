import { AuthUserError, NewUserError, TokenStatus } from "../config/user.config.js"
import { validateAuthToken, validateAuthUser, validateNewUser } from "../middlewares/user.middleware.js"
import { Server, Socket } from 'socket.io'
import { User } from "../models/user.model.js";
import { comparePassword, genPassword, issueJWT, verifyJwt } from "../helpers/utils.helper.js";


export const registerUser = (io: Server, socket: Socket, payload: any) : void => {
    /**
     * @params payload: { email, password, confirmPassword }
     * @returns not validated { errors -> object }
     * @returns validated { true -> boolean
     * validate user
     */
    const errors : NewUserError | boolean = validateNewUser(payload);

    if ( typeof errors !== "boolean" ) {
        socket.emit('user:register:fail', errors);
    } else {
        // encrypt the text password and store new-user with hash and salt
        const encryptPassword = genPassword(payload.password);

        User.create({
            email: payload.email,
            hash: encryptPassword.hash,
            salt: encryptPassword.salt
        }).then((newUser) => {
            const jwt = issueJWT(newUser.id);
            socket.emit('user:register:success', {
                email: newUser.email,
                token: jwt.token,
                expires: jwt.expires
            });
        }).catch((e: Error) => {
            if(e["errors"]["email"]?.message) {
                socket.emit('user:register:fail', {
                    email: [e["errors"]["email"]?.message]
                })
            } else {
                socket.emit('user:register:fail', {
                    general: [e.message]
                })
            }
        })
    }
}

export const loginUser = (io: Server, socket: Socket, payload: any) : void => {
    /**
     * @params payload: { email, password }
     * @returns not validated { errors -> object }
     * @returns validated { true -> boolean
     * validate user
     */
    const errors : AuthUserError | boolean = validateAuthUser(payload);

    if ( typeof errors !== "boolean" ) {
        socket.emit('user:register:fail', errors);
    } else {
        User.findOne({ email: payload.email })
        .then(( user ) => {
            if ( !user ) {
                socket.emit('user:login:fail', {
                    email: ["email is not registered"]
                })
            } else {
                // validate password with found users hash and salt
                const isValidPassword : boolean = comparePassword(payload.password, user.hash, user.salt);

                if ( !isValidPassword ) {
                    socket.emit('user:login:fail', {
                        password: ["Wrong password"]
                    })
                } else {
                    // password matched -> generate jwt token
                    const jwt = issueJWT(user.id)

                    socket.emit('user:login:success', {
                        email: user.email,
                        token: jwt.token,
                        expires: jwt.expires
                    })
                }
            }
        }).catch(( e: Error ) => {
            socket.emit('user:login:fail', {
                general: [e.message]
            })
        })
    }
}

export const refreshToken = (io: Server, socket: Socket, payload: any) : void => {
    validateAuthToken(payload.token)
    .then(( tokenValidate: TokenStatus ) : void => {
        if ( !tokenValidate.validate ) {
            socket.emit('token:refresh:fail', {
                token: [tokenValidate.message]
            })
        } else {
            if(tokenValidate.id) {
                const jwt = issueJWT(tokenValidate.id);
                socket.emit('token:refresh:success', {...tokenValidate.user, token: jwt.token, expires: jwt.expires});
            } else {
                socket.emit('token:refresh:fail', {
                    general: ["not registered"]
                })        
            }
        }
    }).catch(( e: Error ) : void => {
        socket.emit('token:refresh:fail', {
            general: [e.message]
        })
    })
}