# SyncDoc

SyncDoc is a real-time collaborative document editor built with React, Node.js, Express, MongoDB, Socket.IO, and Yjs/CRDT technology.

The project supports collaborative document editing, block-based content management, real-time presence and cursor synchronization, document persistence, and HTML/PDF export.

## Features

* Real-time collaborative document editing
* Yjs/CRDT-based synchronization
* Socket.IO real-time communication
* Block-based document editor
* Text formatting and content blocks
* Heading, list, code and paragraph blocks
* Block duplication and reordering
* Atomic block state management
* Collaborative undo and redo
* Cursor and text selection synchronization
* Collaborator presence and names
* Disconnected collaborator cleanup
* MongoDB document persistence
* HTML export
* PDF export
* Input validation and XSS protection
* Responsive and polished editor interface

## Technology Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* Node.js
* Express.js
* Socket.IO
* MongoDB
* Mongoose
* Yjs

## Project Structure

```text
sync doc/
├── backend/
│   ├── models/
│   ├── services/
│   ├── realtime/
│   └── server.js
├── frontend/
│   ├── src/
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

## Running the Project

### Prerequisites

Make sure Node.js, npm, and MongoDB are installed and MongoDB is running.

### Backend

Open a terminal in the project folder and run:

```bash
cd backend
npm install
npm run dev
```

Backend server:

```text
http://localhost:5000
```

### Frontend

Open a second terminal in the project folder and run:

```bash
cd frontend
npm install
npm run dev
```

Frontend application:

```text
http://localhost:5173
```

## Testing

The final project was tested for:

* Editor functionality
* Text formatting and blocks
* Document saving and persistence
* Block duplication and reordering
* Collaborative undo and redo
* Real-time collaboration
* Collaborator presence
* Cursor synchronization
* Text selection synchronization
* Collaborator names
* Leave and disconnect cleanup
* HTML export
* PDF export
* XSS and security handling
* Multi-client stability
* Backend syntax validation

All final functional tests passed.

## Collaboration

SyncDoc uses Yjs/CRDT concepts together with Socket.IO to synchronize document changes between connected users.

The application tracks:

* Connected collaborators
* Collaborator names
* Active block focus
* Cursor positions
* Text selections
* User join and leave events

## Persistence

Documents are persisted using MongoDB.

## Export

SyncDoc supports exporting documents into:

* HTML
* PDF

Atomic block state and document structure are preserved during export.

## Security

The project includes validation and protection against unsafe HTML/input content, including XSS-related testing.

## Project Status

The SyncDoc project is functionally complete and has passed the final project testing process.

The repository is maintained on the main branch.
