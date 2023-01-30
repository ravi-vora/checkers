import { validateEmail, verifyJwt } from "../helpers/utils.helper.js";
import { User } from "../models/user.model.js";
export const validateNewUser = (user) => {
    const errors = {
        email: [],
        password: [],
        confirmPassword: []
    };
    const email = user.email ? user.email.trim() : user.email;
    const password = user.password;
    const confirmPassword = user.confirmPassword;
    if (!email || email === "")
        errors.email.push("Email is required");
    if (!password || password === "")
        errors.password.push("Password is required");
    if (password && password.length < 6)
        errors.password.push("Password need minimum 6 character");
    if (password && password.length > 14)
        errors.password.push("Password can't be more than 14 character");
    if (!confirmPassword || confirmPassword === "")
        errors.confirmPassword.push("Confirm password is required");
    if (confirmPassword && confirmPassword !== password)
        errors.confirmPassword.push("Confirm password doesn't match with password");
    if (email && !validateEmail(email))
        errors.email.push("Invalid email address");
    if (errors.email.length > 0 ||
        errors.password.length > 0 ||
        errors.confirmPassword.length > 0) {
        Object.keys(errors).map((errorKey) => {
            if (errors[errorKey].length < 1)
                delete errors[errorKey];
        });
        return errors;
    }
    else {
        return true;
    }
};
export const validateAuthUser = (user) => {
    const errors = {
        email: [],
        password: []
    };
    const email = user.email ? user.email.trim() : user.email;
    const password = user.password;
    if (!email || email === "")
        errors.email.push("Email is required");
    if (!password || password === "")
        errors.password.push("Password is required");
    if (email && !validateEmail(email))
        errors.email.push("Invalid email address");
    if (errors.email.length > 0 ||
        errors.password.length > 0) {
        Object.keys(errors).map((errorKey) => {
            if (errors[errorKey].length < 1)
                delete errors[errorKey];
        });
        return errors;
    }
    else {
        return true;
    }
};
export const validateAuthToken = (token) => {
    return new Promise((resolve, reject) => {
        if (!token || token === '') {
            reject({
                validate: false,
                message: 'token is required'
            });
        }
        else {
            const isValidtoken = verifyJwt(token);
            if (!isValidtoken.validate) {
                reject(isValidtoken);
            }
            else {
                User.findById(isValidtoken.id).then((user) => {
                    if (!user) {
                        reject({
                            validate: false,
                            message: "User is not registered"
                        });
                    }
                    else {
                        resolve({
                            validate: true,
                            message: 'User authenticated',
                            user: {
                                email: user.email
                            },
                            id: user.id
                        });
                    }
                }).catch((e) => {
                    reject({
                        validate: false,
                        message: e.message
                    });
                });
            }
        }
    });
};
//# sourceMappingURL=user.middleware.js.map