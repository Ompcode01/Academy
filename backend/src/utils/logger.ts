import winston from "winston";


const logger = winston.createLogger({

    level:"info",

    format:winston.format.combine(

        winston.format.timestamp(),

        winston.format.json()

    ),


    transports:[


        new winston.transports.File({

           filename:
            process.env.LOG_ERROR_FILE || "logs/error.log",

            level:"error"

        }),


        new winston.transports.File({

            filename:
            "logs/combined.log"

        })


    ]

});



// Console logging for development

if(process.env.NODE_ENV !== "production"){

    logger.add(

        new winston.transports.Console({

            format:winston.format.simple()

        })

    );

}



export default logger;