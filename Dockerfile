# SmartBank Queue Management System
# Builds a single container that serves both the API and the frontend.

FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

COPY backend ./backend
COPY frontend ./frontend

WORKDIR /app/backend
ENV PORT=4000
ENV DB_PATH=/app/backend/db/smartbank.sqlite

EXPOSE 4000

# Seed default admin/staff/services on first boot, then start the server.
CMD ["sh", "-c", "node db/seed.js && node server.js"]