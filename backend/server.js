const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./db");
const Document = require("./models/Document");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();


// Home route
app.get("/", (req, res) => {
    res.send("SyncDoc Backend is Running!");
});


// Create a new document
app.post("/api/documents", async (req, res) => {
    try {
        const document = new Document({
            title: req.body.title,
            nodes: req.body.nodes || [],
        });

        const savedDocument = await document.save();

        res.status(201).json(savedDocument);
    } catch (error) {
        res.status(500).json({
            message: "Failed to create document",
            error: error.message,
        });
    }
});


// Get all documents
app.get("/api/documents", async (req, res) => {
    try {
        const documents = await Document.find().sort({ createdAt: -1 });

        res.json(documents);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch documents",
            error: error.message,
        });
    }
});


// Get a single document by ID
app.get("/api/documents/:id", async (req, res) => {
    try {
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


// Update a document
app.put("/api/documents/:id", async (req, res) => {
    try {
        const document = await Document.findByIdAndUpdate(
            req.params.id,
            {
                title: req.body.title,
                nodes: req.body.nodes,
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!document) {
            return res.status(404).json({
                message: "Document not found",
            });
        }

        res.json(document);
    } catch (error) {
        res.status(500).json({
            message: "Failed to update document",
            error: error.message,
        });
    }
});


// Delete a document
app.delete("/api/documents/:id", async (req, res) => {
    try {
        const document = await Document.findByIdAndDelete(req.params.id);

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


// Start server
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`SyncDoc server running on http://localhost:${PORT}`);
});