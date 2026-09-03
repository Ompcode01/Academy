import app from "./app";
import env from "./config/env";
import { startEventReminderScheduler } from "./services/eventScheduler.service";
import { autoCleanupDatabaseDuplicates } from "./services/dbCleanup.service";

app.listen(env.PORT, () => {
    console.log(`
=====================================
 LMS Server Started Successfully 🚀
=====================================
 Server : http://localhost:${env.PORT}
 Environment : ${env.NODE_ENV}
=====================================
`);

    startEventReminderScheduler();
    void autoCleanupDatabaseDuplicates();
});