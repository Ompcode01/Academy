import app from "./app";

import env from "./config/env";


app.listen(env.PORT, () => {

    console.log(`
=====================================
 LMS Server Started Successfully 🚀
=====================================
 Server : http://localhost:${env.PORT}
 Environment : ${env.NODE_ENV}
=====================================
`);

});