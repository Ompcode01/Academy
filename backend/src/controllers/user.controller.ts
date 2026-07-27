import { Request, Response } from "express";
import AppError from "../utils/AppError";


export const getUser = async(
    req:Request,
    res:Response
)=>{


    throw new AppError(
        "User not found",
        404,
        "USER_NOT_FOUND"
    );


};