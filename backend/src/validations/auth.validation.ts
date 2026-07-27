import { z } from "zod";


export const loginSchema = z.object({

    body:z.object({

        email:
        z.string()
        .email("Invalid email"),

        password:
        z.string()
        .min(
            8,
            "Password must contain minimum 8 characters"
        )

    })

});