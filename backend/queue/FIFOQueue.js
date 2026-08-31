class FIFOQueue {
  constructor() {
    this.items = [];
  }

  // Add a customer to the rear of the queue
  enqueue(item) {
    this.items.push(item);
    return item;
  }

  // Remove and return the customer at the front of the queue
  dequeue() {
    if (this.isEmpty()) return null;
    return this.items.shift();
  }

  // Look at the next customer without removing them
  peek() {
    if (this.isEmpty()) return null;
    return this.items[0];
  }

  // Whether the queue has anyone waiting
  isEmpty() {
    return this.items.length === 0;
  }

  // How many people are currently in this queue
  size() {
    return this.items.length;
  }

  // Remove a specific customer out of order (used for Skip / Cancel / Decline)
  // without breaking FIFO order for everyone else.
  remove(queueId) {
    const idx = this.items.findIndex((i) => i.queueId === queueId);
    if (idx === -1) return null;
    return this.items.splice(idx, 1)[0];
  }

  // Put a previously-removed customer back at the FRONT (used for Recall)
  requeueFront(item) {
    this.items.unshift(item);
  }

  // 1-based position of a customer in this queue (0 = not found)
  positionOf(queueId) {
    const idx = this.items.findIndex((i) => i.queueId === queueId);
    return idx === -1 ? 0 : idx + 1;
  }

  // Full ordered snapshot of the queue, front to back
  displayQueue() {
    return [...this.items];
  }
}

module.exports = FIFOQueue;
