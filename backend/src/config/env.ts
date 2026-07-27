import dotenv from "dotenv";

dotenv.config();



const requiredEnv = [

    "DATABASE_URL",

    "JWT_SECRET"

];



requiredEnv.forEach((key)=>{


    if(!process.env[key]){

        throw new Error(
            `${key} is missing in environment variables`
        );

    }


});



const env = {

    NODE_ENV:
    process.env.NODE_ENV || "development",


    PORT:
    Number(process.env.PORT) || 5000,


    DATABASE_URL:
    process.env.DATABASE_URL!,


    JWT_SECRET:
    process.env.JWT_SECRET!,


    JWT_EXPIRES_IN:
    process.env.JWT_EXPIRES_IN || "1d",


    LOG_LEVEL:
    process.env.LOG_LEVEL || "info"

};


export default env;