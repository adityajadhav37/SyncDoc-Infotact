const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const Y = require("yjs");

require("dotenv").config();

const connectDB = require("./db");
const Document = require("./models/Document");

const {
    getYDocument,
    initializeYDocument,
    removeYDocument,
} = require("./realtime/yjsManager");

const app = express();

// Create HTTP server for Express + Socket.io
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
        ],
        methods: ["GET", "POST"],
    },
});
// Track recently processed Yjs updates
const processedYjsUpdates = new Map();

// Middleware
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
        ],
    })
);
app.use(express.json());

// Connect to MongoDB
connectDB();

// ================================
// HOME ROUTE
// ================================
app.get("/", (req, res) => {
    res.json({
        message: "SyncDoc Backend is Running!",
        status: "success",
    });
});

// ================================
// CREATE DOCUMENT
// ================================
app.post("/api/documents", async (req, res) => {
    try {
        const { title, nodes } = req.body;

        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                message: "Document title is required",
            });
        }

        if (nodes !== undefined && !Array.isArray(nodes)) {
            return res.status(400).json({
                message: "Document nodes must be an array",
            });
        }

        const document = new Document({
            title: title.trim(),
            nodes: nodes || [],
        });

        const savedDocument = await document.save();

        res.status(201).json(savedDocument);
    } catch (error) {
        res.status(400).json({
            message: "Failed to create document",
            error: error.message,
        });
    }
});

// ================================
// GET ALL DOCUMENTS
// ================================
app.get("/api/documents", async (req, res) => {
    try {
        const documents = await Document.find().sort({
            createdAt: -1,
        });

        res.json(documents);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch documents",
            error: error.message,
        });
    }
});

// ================================
// GET SINGLE DOCUMENT
// ================================
app.get("/api/documents/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid document ID",
            });
        }

        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({
                message: "Document not found",
            });
        }

        res.json(document);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch document",
            error: error.message,
        });
    }
});

// ================================
// UPDATE DOCUMENT
// ================================
app.put("/api/documents/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid document ID",
            });
        }

        const { title, nodes } = req.body;

        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                message: "Document title is required",
            });
        }

        if (nodes !== undefined && !Array.isArray(nodes)) {
            return res.status(400).json({
                message: "Document nodes must be an array",
            });
        }

        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({
                message: "Document not found",
            });
        }

        document.title = title.trim();
        document.nodes = nodes || [];

        const updatedDocument = await document.save();

        res.json(updatedDocument);
    } catch (error) {
        res.status(400).json({
            message: "Failed to update document",
            error: error.message,
        });
    }
});

// ================================
// DELETE DOCUMENT
// ================================
app.delete("/api/documents/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid document ID",
            });
        }

        const document = await Document.findByIdAndDelete(
            req.params.id
        );

        if (!document) {
            return res.status(404).json({
                message: "Document not found",
            });
        }

        // Remove in-memory Yjs document if it exists
        removeYDocument(req.params.id);

        res.json({
            message: "Document deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete document",
            error: error.message,
        });
    }
});

// ================================
// SOCKET.IO CONNECTION
// ================================
io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ================================
    // JOIN DOCUMENT
    // ================================
    socket.on("join-document", async (documentId) => {
        try {
            if (!documentId) {
                return;
            }

            if (!mongoose.isValidObjectId(documentId)) {
                socket.emit("document-error", {
                    message: "Invalid document ID",
                });

                return;
            }

            const document = await Document.findById(
                documentId
            ).lean();

            if (!document) {
                socket.emit("document-error", {
                    message: "Document not found",
                });

                return;
            }

            // Initialize or retrieve the server-side Yjs document
            const ydoc = initializeYDocument(
                documentId,
                document
            );

            const documentMap =
                ydoc.getMap("document");

            const blocksArray =
                ydoc.getArray("blocks");

            // Join Socket.io room
            socket.join(
                `document:${documentId}`
            );

            console.log(
                `Socket ${socket.id} joined document ${documentId}`
            );

            // Convert Yjs blocks to normal JSON
            const nodes = blocksArray
                .toArray()
                .map((block) => ({
                    id: block.get("id"),
                    type:
                        block.get("type") ||
                        "paragraph",
                    content:
                        block.get("content") ||
                        "",
                    children: JSON.parse(
                        block.get("children") ||
                            "[]"
                    ),
                }));

            // Send current collaborative state
            socket.emit("document-joined", {
                documentId,

                title:
                    documentMap.get("title") ||
                    document.title,

                nodes,

                yjsState: Array.from(
                    Y.encodeStateAsUpdate(
                        ydoc
                    )
                ),
            });

            console.log(
                `Initial Yjs state sent to ${socket.id}`
            );
        } catch (error) {
            console.error(
                "Failed to join collaborative document:",
                error.message
            );

            socket.emit("document-error", {
                message:
                    "Failed to join document",
            });
        }
    });

    // ================================
    // LEAVE DOCUMENT
    // ================================
    socket.on(
    "yjs-update",
    ({ documentId, update }) => {
        try {
            if (
                !documentId ||
                !update
            ) {
                return;
            }

            if (
                !mongoose.isValidObjectId(
                    documentId
                )
            ) {
                return;
            }

            const updateArray =
                new Uint8Array(update);

            // Create a simple fingerprint for
            // this Yjs update.
            const updateKey =
                `${documentId}:${Array.from(
                    updateArray
                ).join(",")}`;

            // Ignore an update that has already
            // been processed.
            if (
                processedYjsUpdates.has(
                    updateKey
                )
            ) {
                console.log(
                    `Duplicate Yjs update ignored for document ${documentId}`
                );

                return;
            }

            // Remember this update.
            processedYjsUpdates.set(
                updateKey,
                Date.now()
            );

            // Keep the memory map small.
            // Remove entries older than 60 seconds.
            setTimeout(() => {
                processedYjsUpdates.delete(
                    updateKey
                );
            }, 60000);

            // Get the authoritative server-side
            // Yjs document.
            const ydoc =
                getYDocument(
                    documentId
                );

            // Apply the update to the server.
            Y.applyUpdate(
                ydoc,
                updateArray,
                "server"
            );

            // Send the update only to the
            // other clients in the room.
            socket
                .to(
                    `document:${documentId}`
                )
                .emit(
                    "yjs-update",
                    {
                        documentId,
                        update: Array.from(
                            updateArray
                        ),
                    }
                );

            console.log(
                `Yjs update applied and broadcast for document ${documentId}`
            );
        } catch (error) {
            console.error(
                "Failed to process Yjs update:",
                error.message
            );
        }
    }
);

    // ================================
    // DISCONNECT
    // ================================
    socket.on(
        "disconnect",
        () => {
            console.log(
                `Socket disconnected: ${socket.id}`
            );
        }
    );
});

// ================================
// START SERVER
// ================================
const PORT = 5000;

server.listen(PORT, () => {
    console.log(
        `SyncDoc server running on http://localhost:${PORT}`
    );
});