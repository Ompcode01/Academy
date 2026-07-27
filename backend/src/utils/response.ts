import { Response } from "express";


interface ApiResponse<T>{

    success:boolean;

    message:string;

    data?:T;

    errorCode?:string;

    timestamp:string;

}



export const successResponse = <T>(
    
    res:Response,

    data:T,

    message:string = "Success",

    statusCode:number = 200

)=>{


    const response:ApiResponse<T> = {

        success:true,

        message,

        data,

        timestamp:
        new Date().toISOString()

    };


    return res
        .status(statusCode)
        .json(response);

};





export const errorResponse = (

    res:Response,

    message:string,

    errorCode:string = "INTERNAL_ERROR",

    statusCode:number = 500

)=>{


    const response:ApiResponse<null> = {


        success:false,

        message,

        errorCode,

        timestamp:
        new Date().toISOString()

    };


    return res
        .status(statusCode)
        .json(response);

};