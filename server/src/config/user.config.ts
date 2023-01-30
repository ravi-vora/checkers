export interface Password {
    hash: string,
    salt: string
}

export interface Token {
    token: string,
    expires: string
}

export interface TokenStatus {
    validate: boolean,
    message: string,
    id?: string,
    token?: string,
    expires?: string,
    user?: object
}

export interface AuthUserSchema {
    email: string,
    password: string
}

export interface AuthUserError {
    email: string[],
    password: string[]
}

export interface NewUserSchema {
    email: string,
    password: string,
    confirmPassword?: string
}

export interface NewUserError {
    email: string[],
    password: string[],
    confirmPassword: string[]
}