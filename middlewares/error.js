class ErrorHandler extends Error {
    constructor(message, statusCode=500) {
        super(message); 
        //* constructor of Error(parent class)
        this.statusCode = statusCode
    }
}

export const errorMiddleware = (err,_,res,next) => {
    err.message = err.message || "Internal server error";
    err.statusCode = err.statusCode || 500;
    res.status(err.statusCode).json({
        success: false,
        message: err.message
    });
}

export default ErrorHandler;