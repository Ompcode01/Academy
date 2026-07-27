class AppError extends Error {

    statusCode: number;
    errorCode: string;
    isOperational: boolean;


    constructor(
        message: string,
        statusCode: number = 500,
        errorCode: string = "INTERNAL_ERROR"
    ) {

        super(message);

        this.statusCode = statusCode;

        this.errorCode = errorCode;

        this.isOperational = true;


        Error.captureStackTrace(
            this,
            this.constructor
        );
    }

}


export default AppError;