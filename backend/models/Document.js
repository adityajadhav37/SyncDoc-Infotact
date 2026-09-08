const mongoose = require("mongoose");

const nodeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "document",
        "heading",
        "paragraph",
        "list",
        "listItem",
        "code",
      ],
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

// Recursive AST validation
const validateNode = (node) => {
  if (!node || typeof node !== "object") {
    throw new Error("Invalid AST node");
  }

  const allowedTypes = [
    "document",
    "heading",
    "paragraph",
    "list",
    "listItem",
    "code",
  ];

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

// Validate AST before saving
documentSchema.pre("save", function () {
  this.nodes.forEach((node) => {
    validateNode(node);
  });
});

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;