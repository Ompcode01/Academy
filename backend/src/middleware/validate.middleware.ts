import {
    Request,
    Response,
    NextFunction
} from "express";

import {
    ZodSchema
} from "zod";



const validate = (
    schema: ZodSchema
) => {


    return (

        req:Request,

        res:Response,

        next:NextFunction

    ) => {


        const result =
        schema.safeParse({

            body:req.body,

            params:req.params,

            query:req.query

        });



        if (!result.success) {
          return res.status(400).json({
            success: false,
            message: "Validation failed",
            errorCode: "VALIDATION_ERROR",
            errors: (result as any).error?.errors || (result as any).error,
          });
        }

        req.body = (result.data as any)?.body || req.body;
        next();

    };

};



export default validate;