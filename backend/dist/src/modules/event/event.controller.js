"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEvents = void 0;
const event_service_1 = __importDefault(require("./event.service"));
const getEvents = async (req, res) => {
    try {
        const events = await event_service_1.default.getAllEvents();
        res.json({ success: true, data: events });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getEvents = getEvents;
const createEvent = async (req, res) => {
    try {
        const { title, description, eventDate, eventTime, url, eventType, courseId } = req.body;
        if (!title || !eventDate) {
            return res.status(400).json({ success: false, message: "Title and Event Date are required." });
        }
        const creatorName = req.user ? `${req.user.username} (${req.user.role || 'USER'})` : "System User";
        const creatorId = req.user?.employeeId ? BigInt(req.user.employeeId) : null;
        const event = await event_service_1.default.createEvent({
            title,
            description,
            eventDate: new Date(eventDate),
            eventTime,
            url,
            eventType: eventType || "site",
            courseId: courseId ? BigInt(courseId) : null,
            creatorId,
            creatorName,
        });
        res.json({ success: true, message: "Event created successfully", data: event });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createEvent = createEvent;
const updateEvent = async (req, res) => {
    try {
        const id = BigInt(String(req.params.id));
        const { title, description, eventDate, eventTime, url, eventType } = req.body;
        const actorName = req.user ? `${req.user.username} (${req.user.role || 'USER'})` : "System User";
        const updated = await event_service_1.default.updateEvent(id, {
            title,
            description,
            eventDate: eventDate ? new Date(eventDate) : undefined,
            eventTime,
            url,
            eventType,
        }, actorName);
        res.json({ success: true, message: "Event updated successfully", data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateEvent = updateEvent;
const deleteEvent = async (req, res) => {
    try {
        const id = BigInt(String(req.params.id));
        const actorName = req.user ? `${req.user.username} (${req.user.role || 'USER'})` : "System User";
        const deleted = await event_service_1.default.deleteEvent(id, actorName);
        res.json({ success: true, message: "Event deleted successfully", data: deleted });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteEvent = deleteEvent;
