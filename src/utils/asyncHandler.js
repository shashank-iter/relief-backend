const asyncHandler = (requestHandler) => {
    return async (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) =>
            next(err)
        );
    };
};

export default asyncHandler;

// try to understand this code deeply


// asyncHandler is a higher order function that takes a function as an argument and returns a new function. This new function is an asynchronous function that wraps the original function in a Promise.resolve() call. This allows us to use async/await syntax in our route handlers without having to write try/catch blocks for error handling.

// const asyncHandler = () => {}
// const asyncHandler = () => () => {}
//  const asyncHandler = () => async () => {}

// try catch method of handling requests.
// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next);
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };
