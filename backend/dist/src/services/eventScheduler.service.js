"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndDispatchEventReminders = checkAndDispatchEventReminders;
exports.startEventReminderScheduler = startEventReminderScheduler;
exports.stopEventReminderScheduler = stopEventReminderScheduler;
const prisma_1 = __importDefault(require("../config/prisma"));
const notification_service_1 = __importDefault(require("../modules/notification/notification.service"));
let schedulerInterval = null;
function parseEventStartDateTime(eventDate, eventTime) {
    const dt = new Date(eventDate);
    if (!eventTime || !eventTime.trim()) {
        // If no specific time set, default to 09:00 AM on eventDate
        dt.setHours(9, 0, 0, 0);
        return dt;
    }
    const timeStr = eventTime.trim().toUpperCase();
    // Match 24-hour format "13:30" or "09:15"
    const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
        const hours = parseInt(match24[1], 10);
        const minutes = parseInt(match24[2], 10);
        dt.setHours(hours, minutes, 0, 0);
        return dt;
    }
    // Match 12-hour format "1:30 PM" or "09:15 AM"
    const match12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match12) {
        let hours = parseInt(match12[1], 10);
        const minutes = parseInt(match12[2], 10);
        const ampm = match12[3];
        if (ampm === "PM" && hours < 12)
            hours += 12;
        if (ampm === "AM" && hours === 12)
            hours = 0;
        dt.setHours(hours, minutes, 0, 0);
    }
    return dt;
}
async function checkAndDispatchEventReminders() {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        // Auto-delete past events prior to today
        await prisma_1.default.event.deleteMany({
            where: {
                eventDate: {
                    lt: startOfToday,
                },
            },
        }).catch(() => { });
        // Look at events starting around now (from 15 minutes ago up to 2 minutes in future)
        const windowStart = new Date(now.getTime() - 15 * 60 * 1000);
        const windowEnd = new Date(now.getTime() + 2 * 60 * 1000);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
        const pendingEvents = await prisma_1.default.event.findMany({
            where: {
                reminderSent: false,
                eventDate: {
                    gte: todayStart,
                    lte: todayEnd,
                },
            },
        });
        for (const event of pendingEvents) {
            const startDt = parseEventStartDateTime(event.eventDate, event.eventTime);
            // Trigger 2nd notification 1 minute before (or when starting now)
            if (startDt <= windowEnd && startDt >= windowStart) {
                console.log(`[EventScheduler] 🚨 Triggering 2nd Live Alert Notification for event "${event.title}" (ID: ${event.id})`);
                await notification_service_1.default.notifyCalendarEvent({
                    eventId: BigInt(event.id),
                    title: event.title,
                    eventDate: event.eventDate,
                    eventTime: event.eventTime,
                    url: event.url,
                    eventType: event.eventType,
                    courseId: event.courseId ? BigInt(event.courseId) : null,
                    departmentId: event.departmentId ? BigInt(event.departmentId) : null,
                    action: "STARTING_NOW",
                });
                await prisma_1.default.event.update({
                    where: { id: event.id },
                    data: { reminderSent: true },
                });
            }
        }
    }
    catch (err) {
        console.error("[EventScheduler] Error checking event reminders:", err);
    }
}
function startEventReminderScheduler() {
    if (schedulerInterval)
        return;
    console.log("⚡ Starting Live Event Reminder Scheduler (runs every 30s)...");
    // Check immediately on startup
    checkAndDispatchEventReminders();
    // Check every 30 seconds
    schedulerInterval = setInterval(checkAndDispatchEventReminders, 30 * 1000);
}
function stopEventReminderScheduler() {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
}
