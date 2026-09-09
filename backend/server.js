const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("./db");
const Document = require("./models/Document");

const app = express();

// Middleware
app.use(cors());
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

        // Validate request body
        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                message: "Document title is required",
            });
        }

        // Validate nodes
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

        // Validate title
        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                message: "Document title is required",
            });
        }

        // Validate nodes
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

        // Save through Mongoose.
        // Recursive AST validation runs here.
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
// START SERVER
// ================================
const PORT = 5000;

app.listen(PORT, () => {
    console.log(
        `SyncDoc server running on http://localhost:${PORT}`
    );
});