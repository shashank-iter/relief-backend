// we are standardizing the error response format for our API
class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong!",
        errors = [],
        stack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ApiError;
// ApiError is a custom error class that extends the built-in Error class. It takes four arguments: statusCode, message, errors, and stack. The statusCode is the HTTP status code to be sent in the response. The message is a human-readable error message. The errors array is an array of error objects. The stack is the stack trace of the error.