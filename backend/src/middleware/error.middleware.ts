import {
    Request,
    Response,
    NextFunction
} from "express";

import AppError from "../utils/AppError";

import logger from "../utils/logger";



const errorHandler = (

    err: Error,

    req: Request,

    res: Response,

    next: NextFunction

) => {


    /*
        Log every error
    */

    logger.error({

        message: err.message,

        stack: err.stack,

        method: req.method,

        url: req.originalUrl,

        ip: req.ip

    });



    /*
        Default Error Values
    */

    let statusCode = 500;

    let message = "Internal Server Error";

    let errorCode = "INTERNAL_ERROR";



    /*
        Operational Errors
        (Our Custom Errors)
    */

    if(err instanceof AppError){


        statusCode = err.statusCode;

        message = err.message;

        errorCode = err.errorCode;


    }



    /*
        Production Response
    */

    return res
        .status(statusCode)
        .json({

            success:false,

            message,

            errorCode,

            timestamp:
            new Date().toISOString()


        });


};



export default errorHandler;