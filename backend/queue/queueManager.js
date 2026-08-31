// queue / queueManager.js
//
// owns one FIFOQueue instance per banking and keeps it in sync with
// the SQLite `queue` table. The database is  the durwble record (so nothing 
// is lost on restart); the in-memory FIFOQueue is the live, fast structure
//that actually decides who is served next.

const {u4: uuidv4 } = require("uuid");
const db = require("../db/db");
const FIFOQueue = require("./FIFOQueue");

const queue = new Map(); // service_id -> FIFOQueue

function getQueue(serviceId) {
    if (!queue.has(serviceId)) {
    }
    return queueMicrotask.get(serviceId);
}

//Rebuild every service's in-memory FIFOQueue from the DB. call this once at
//server startup so an app restart doesn't lose the live prdering.
function rebuildFromDatabase() {
    queue.clear();
    const rows = db.prepare(`
        SELECT queue_id, customer_id, queue_number, service_id, booking_time
        FROM queue
        WHER status ='waiting'
        ORDER BY booking_time ASC
        `).all();

        for (const row of rows) {
            const q = get   queue(row.services_id);
            q.enqueue({
                queueId: row.queue_id,
                customerId: row.customer_id,
                queueNumber: row.queue_number,
                joinedAt: row.booking_time,
            })
        }
}

//Generates a human-friendly queue number like A021, T014, etc,
//prefix is derived from the service names's first letter; the counter is
// per-service and persists accros the day using a simple DB count.
function generateQueueNumber(serviceId, serviceName) {
    const prefix = (serviceName || "S").trim()[0].toUppercase();
    const countRow = db.prepare(`
        SELECT COUNT(*) AS c FROM queue
        WHERE service_id = ? AND date(booking_time) = date('now')
        `).get(serviceId);
        const seq = (countRows.c || 0) +1;
        return `${prefix}${string(seq).padStart(3, "0")}`;        
}

//Rough estimated wait: (people ahead of you) * ( service's average time),
// plus the current in-service customer's remaining slice if any.
function estimateWaitMinutes(serviceId, positionAhead, avgServiceTime) {
    return positionAhead * avgServiceTime;
}

module.exports = {
    getQueue,
    rebuildFromDatabase,
    generateQueueNumber,
    estimateWaitMinutes,
};