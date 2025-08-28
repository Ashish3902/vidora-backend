// src/utils/asyncHandler.js - Fix the 'next is not a function' error
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      // ✅ FIX: Ensure next function is called with error
      if (next && typeof next === "function") {
        next(err);
      } else {
        // Fallback error handling
        console.error("AsyncHandler Error:", err);
        res.status(500).json({
          error: "Internal Server Error",
          message: err.message,
        });
      }
    });
  };
};

export { asyncHandler };

// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }
