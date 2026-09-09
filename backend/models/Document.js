const mongoose = require("mongoose");

// Allowed AST node types
const allowedTypes = [
    "document",
    "heading",
    "paragraph",
    "list",
    "listItem",
    "code",
];

// Recursive AST validation
const validateNode = (node) => {
    if (!node || typeof node !== "object") {
        throw new Error("Invalid AST node");
    }

    if (!allowedTypes.includes(node.type)) {
        throw new Error(`Invalid node type: ${node.type}`);
    }

    if (node.children && !Array.isArray(node.children)) {
        throw new Error("Node children must be an array");
    }

    if (node.children) {
        node.children.forEach((child) => {
            validateNode(child);
        });
    }
};

// AST Node Schema
const nodeSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: allowedTypes,
        },

        content: {
            type: String,
            default: "",
        },

        children: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
        },
    },
    {
        _id: false,
    }
);

// Document Schema
const documentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        nodes: {
            type: [nodeSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// Validate the complete AST before saving
documentSchema.pre("save", function () {
    this.nodes.forEach((node) => {
        validateNode(node);
    });
});

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;