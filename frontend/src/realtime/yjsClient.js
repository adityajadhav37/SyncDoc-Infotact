import * as Y from "yjs";

// Store active Yjs documents in memory
const activeDocuments = new Map();

// Special origin used when applying updates received
// from the collaboration server.
export const REMOTE_ORIGIN = Symbol("SYNC_DOC_REMOTE");

// Create or retrieve a Yjs document
export const getYDocument = (documentId) => {
    if (!activeDocuments.has(documentId)) {
        const ydoc = new Y.Doc();

        // Shared document metadata
        ydoc.getMap("document");

        // Shared AST blocks
        ydoc.getArray("blocks");

        // Store collaboration information directly
        // on our own manager object instead of relying
        // on private Yjs properties.
        activeDocuments.set(documentId, {
            ydoc,
            updateListener: null,
            remoteUpdate: false,
        });
    }

    return activeDocuments.get(documentId).ydoc;
};

// Get collaboration metadata for a document
export const getDocumentManager = (documentId) => {
    return activeDocuments.get(documentId) || null;
};

// Mark that an incoming server update is being applied
export const applyRemoteUpdate = (
    documentId,
    update
) => {
    const manager =
        activeDocuments.get(documentId);

    if (!manager) {
        return;
    }

    manager.remoteUpdate = true;

    try {
        Y.applyUpdate(
            manager.ydoc,
            new Uint8Array(update),
            REMOTE_ORIGIN
        );
    } finally {
        manager.remoteUpdate = false;
    }
};

// Remove a Yjs document from memory
export const removeYDocument = (documentId) => {
    const manager =
        activeDocuments.get(documentId);

    if (!manager) {
        return;
    }

    if (manager.updateListener) {
        manager.ydoc.off(
            "update",
            manager.updateListener
        );
    }

    manager.ydoc.destroy();

    activeDocuments.delete(documentId);
};

// Get number of active Yjs documents
export const getActiveYDocumentCount = () => {
    return activeDocuments.size;
};