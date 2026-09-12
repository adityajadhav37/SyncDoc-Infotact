const Y = require("yjs");

// Store active Yjs documents in memory
const activeDocuments = new Map();

// Get an existing Yjs document or create a new one
const getYDocument = (documentId) => {
    if (!activeDocuments.has(documentId)) {
        const ydoc = new Y.Doc();

        // Shared document metadata
        ydoc.getMap("document");

        // Shared array for AST blocks
        ydoc.getArray("blocks");

        activeDocuments.set(documentId, ydoc);
    }

    return activeDocuments.get(documentId);
};

// Initialize Yjs document with data from MongoDB
const initializeYDocument = (documentId, documentData) => {
    const ydoc = getYDocument(documentId);

    const documentMap = ydoc.getMap("document");
    const blocksArray = ydoc.getArray("blocks");

    // Only initialize an empty Yjs document
    if (documentMap.size === 0 && blocksArray.length === 0) {
        // Store document title
        documentMap.set("title", documentData.title);

        // Convert MongoDB AST blocks into Yjs maps
        const blocks = (documentData.nodes || []).map((node, index) => {
            const block = new Y.Map();

            block.set(
                "id",
                node._id || `block-${index + 1}`
            );

            block.set("type", node.type || "paragraph");
            block.set("content", node.content || "");
            block.set(
                "children",
                JSON.stringify(node.children || [])
            );

            return block;
        });

        // Add all blocks to the shared Yjs array
        if (blocks.length > 0) {
            blocksArray.push(blocks);
        }
    }

    return ydoc;
};

// Remove a Yjs document from memory
const removeYDocument = (documentId) => {
    const ydoc = activeDocuments.get(documentId);

    if (ydoc) {
        ydoc.destroy();
        activeDocuments.delete(documentId);
    }
};

// Get number of active collaborative documents
const getActiveDocumentCount = () => {
    return activeDocuments.size;
};

module.exports = {
    getYDocument,
    initializeYDocument,
    removeYDocument,
    getActiveDocumentCount,
};