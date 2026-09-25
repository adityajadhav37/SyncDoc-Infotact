import {
    useEffect,
    useRef,
    useState,
} from "react";
import { io } from "socket.io-client";
import * as Y from "yjs";

import Block from "./Block";

import {
    getYDocument,
    getDocumentManager,
    applyRemoteUpdate,
    removeYDocument,
    REMOTE_ORIGIN,
} from "./realtime/yjsClient";

import "./App.css";

const API_URL = "http://localhost:5000/api/documents";

const socket = io("http://localhost:5000");

// Unique identity for this browser session.
// This will be used for collaboration presence.
const clientId =
    `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
const collaboratorName =
    `User-${clientId.slice(-6)}`;
// ========================================
// CONVERT YJS BLOCKS TO REACT OBJECTS
// ========================================

const getNodesFromYDoc = (ydoc) => {
    const blocksArray = ydoc.getArray("blocks");

    return blocksArray.toArray().map((block) => ({
        id: block.get("id"),
        type: block.get("type") || "paragraph",
        content: block.get("content") || "",
        children: JSON.parse(
            block.get("children") || "[]"
        ),
        atomic: Boolean(
            block.get("atomic")
        ),
    }));
};

// ========================================
// APP
// ========================================

function App() {
    const [documents, setDocuments] = useState([]);
    const [selectedDocument, setSelectedDocument] =
        useState(null);

    const [title, setTitle] = useState("");
    const [nodes, setNodes] = useState([]);
    // Track blocks currently being edited by other collaborators
const [activeCollaborators, setActiveCollaborators] =
    useState({});
const [connectedUsers, setConnectedUsers] =
    useState({});
    const [cursorPositions, setCursorPositions] =
    useState({});
    const [collaboratorNames, setCollaboratorNames] =
    useState({});
    const [atomicBlocks, setAtomicBlocks] =
        useState({});
    const [activeBlockId, setActiveBlockId] =
    useState(null);    
    const [newDocumentTitle, setNewDocumentTitle] =
        useState("");

    const [showCreateForm, setShowCreateForm] =
        useState(false);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [hasUnsavedChanges, setHasUnsavedChanges] =
        useState(false);

    // Keep track of the currently joined document.
    const joinedDocumentId = useRef(null);

    // ========================================
    // FETCH ALL DOCUMENTS
    // ========================================

    const fetchDocuments = async () => {
        try {
            setLoading(true);

            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error(
                    "Failed to fetch documents"
                );
            }

            const data = await response.json();

            setDocuments(data);
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // INITIAL DOCUMENT FETCH
    // ========================================

    useEffect(() => {
        fetchDocuments();
    }, []);

   // ========================================
// SOCKET.IO + YJS COLLABORATION
// ========================================

useEffect(() => {
    // ----------------------------------------
    // DOCUMENT JOINED
    // ----------------------------------------

    const handleDocumentJoined = (data) => {
        console.log(
            "Collaborative document joined:",
            data
        );

        const ydoc = getYDocument(
            data.documentId
        );

        // Apply the initial server Yjs state.
        if (data.yjsState) {
            applyRemoteUpdate(
                data.documentId,
                data.yjsState
            );
        }

        const updatedNodes =
            getNodesFromYDoc(ydoc);

        setNodes(updatedNodes);

        setTitle(
            data.title || ""
        );

        setHasUnsavedChanges(false);

        console.log(
            "Initial Yjs state applied:",
            data.documentId
        );
    };
// ----------------------------------------
// RECEIVE YJS UPDATE
// ----------------------------------------

const handleYjsUpdate = ({
    documentId,
    update,
}) => {
    if (!documentId || !update) {
        return;
    }

    console.log(
        "Received Yjs update:",
        documentId
    );

    applyRemoteUpdate(
        documentId,
        update
    );

    if (
        joinedDocumentId.current ===
        documentId
    ) {
        const ydoc =
            getYDocument(
                documentId
            );

        const updatedNodes =
            getNodesFromYDoc(
                ydoc
            );

        setNodes(updatedNodes);

        const updatedTitle =
            ydoc
                .getMap("document")
                .get("title") || "";

        setTitle(updatedTitle);

        setActiveBlockId(
            (currentActiveBlockId) => {
                if (
                    !currentActiveBlockId
                ) {
                    return null;
                }

                const activeBlockStillExists =
                    updatedNodes.some(
                        (node) =>
                            node.id ===
                            currentActiveBlockId
                    );

                return activeBlockStillExists
                    ? currentActiveBlockId
                    : null;
            }
        );

        setHasUnsavedChanges(true);
    }

    console.log(
        "Remote Yjs update applied:",
        documentId
    );
};
    // ----------------------------------------
    // COLLABORATOR BLOCK FOCUS
    // ----------------------------------------

    const handleBlockFocused = ({
        documentId,
        blockId,
        clientId: focusedClientId,
    }) => {
        if (
            joinedDocumentId.current !==
            documentId
        ) {
            return;
        }

        if (
            focusedClientId === clientId
        ) {
            return;
        }

        setActiveCollaborators(
            (current) => ({
                ...current,
                [blockId]: focusedClientId,
            })
        );

        console.log(
            "Collaborator focused block:",
            blockId,
            "Client:",
            focusedClientId
        );
    };
// ----------------------------------------
// COLLABORATOR BLOCK BLUR
// ----------------------------------------

const handleBlockBlurred = ({
    documentId,
    blockId,
    clientId: blurredClientId,
}) => {
    if (
        joinedDocumentId.current !==
        documentId
    ) {
        return;
    }

    setActiveCollaborators(
        (current) => {
            if (
                current[blockId] !==
                blurredClientId
            ) {
                return current;
            }

            const updated = {
                ...current,
            };

            delete updated[blockId];

            return updated;
        }
    );

    // Clear the remote cursor for this block.
    setCursorPositions(
        (current) => {
            const cursor =
                current[blockId];

            if (
                !cursor ||
                cursor.clientId !==
                    blurredClientId
            ) {
                return current;
            }

            const updated = {
                ...current,
            };

            delete updated[blockId];

            return updated;
        }
    );

    console.log(
        "Collaborator left block:",
        blockId,
        "Client:",
        blurredClientId
    );
};
    // ----------------------------------------
    // DOCUMENT ERROR
    // ----------------------------------------

    const handleDocumentError = (data) => {
        console.error(
            "Document error:",
            data
        );

        setMessage(
            data?.message ||
                "Collaborative document error."
        );
    };

    // ----------------------------------------
// INITIAL DOCUMENT USERS
// ----------------------------------------
const handleDocumentUsers = ({
    documentId,
    clientIds,
    users = [],
}) => {
    if (
        documentId !==
        joinedDocumentId.current
    ) {
        return;
    }

    const connectedUsers = {};

    clientIds.forEach(
        (existingClientId) => {
            connectedUsers[
                existingClientId
            ] = true;
        }
    );

    setConnectedUsers(
        connectedUsers
    );

    // Store collaborator names.
    const names = {};

    users.forEach((user) => {
        if (user?.clientId) {
            names[user.clientId] =
                user.collaboratorName ||
                `User-${user.clientId.slice(-6)}`;
        }
    });

    setCollaboratorNames(names);

    // Remove cursor positions belonging
    // to collaborators who are no longer
    // connected to this document.
    setCursorPositions((current) => {
        const updated = {};

        Object.entries(current).forEach(
            ([blockId, cursor]) => {
                if (
                    cursor &&
                    clientIds.includes(
                        cursor.clientId
                    )
                ) {
                    updated[blockId] = cursor;
                }
            }
        );

        return updated;
    });

    console.log(
        `Document users updated: ${clientIds.length}`
    );
};
    // ----------------------------------------
    // USER JOINED DOCUMENT
    // ----------------------------------------

   const handleUserJoinedDocument = ({
    documentId,
    clientId: joinedClientId,
    collaboratorName,
}) => {
        if (
            documentId !==
                joinedDocumentId.current ||
            joinedClientId === clientId
        ) {
            return;
        }

        setConnectedUsers(
            (current) => ({
                ...current,
                [joinedClientId]: true,
            })
        );
        setCollaboratorNames(
    (current) => ({
        ...current,
        [joinedClientId]:
            collaboratorName ||
            `User-${joinedClientId.slice(-6)}`,
    })
);
        console.log(
            `User ${joinedClientId} joined the document`
        );
    };

  // ----------------------------------------
// USER LEFT DOCUMENT
// ----------------------------------------

const handleUserLeftDocument = ({
    documentId,
    clientId: leftClientId,
}) => {
    if (
        documentId !==
        joinedDocumentId.current
    ) {
        return;
    }

    setConnectedUsers(
        (current) => {
            const updated = {
                ...current,
            };

            delete updated[leftClientId];

            return updated;
        }
    );

    // Remove the collaborator name.
    setCollaboratorNames(
        (current) => {
            const updated = {
                ...current,
            };

            delete updated[leftClientId];

            return updated;
        }
    );

    console.log(
        `User ${leftClientId} left the document`
    );
};
    // ----------------------------------------
    // REGISTER SOCKET LISTENERS
    // ----------------------------------------

    socket.on(
        "document-joined",
        handleDocumentJoined
    );

    socket.on(
        "yjs-update",
        handleYjsUpdate
    );

    socket.on(
        "block-focused",
        handleBlockFocused
    );

    socket.on(
        "block-blurred",
        handleBlockBlurred
    );
    // ----------------------------------------
    // COLLABORATOR CURSOR POSITION
    // ----------------------------------------

   const handleCursorPosition = ({
    documentId,
    blockId,
    cursorPosition,
    selectionEnd,
    clientId: remoteClientId,
    collaboratorName: remoteCollaboratorName,

}) => {
   console.log(
    "Remote cursor position received:",
    {
        documentId,
        blockId,
        cursorPosition,
        selectionEnd,
        remoteClientId,
    }
);

    if (
        documentId !== joinedDocumentId.current ||
        !blockId ||
        cursorPosition === undefined ||
        !remoteClientId
    ) {
        return;
    }

    // Ignore our own cursor position.
    if (remoteClientId === clientId) {
        return;
    }

   setCursorPositions((previous) => ({
    ...previous,
  [blockId]: {
    position: cursorPosition,
    selectionEnd,
    clientId: remoteClientId,
    collaboratorName:
        remoteCollaboratorName ||
        `User-${remoteClientId.slice(-6)}`,
},
}));
};

    socket.on(
        "cursor-position",
        handleCursorPosition
    );
    socket.on(
        "document-users",
        handleDocumentUsers
    );

    socket.on(
        "user-joined-document",
        handleUserJoinedDocument
    );

    socket.on(
        "user-left-document",
        handleUserLeftDocument
    );

    socket.on(
        "document-error",
        handleDocumentError
    );

    // ----------------------------------------
    // CLEANUP
    // ----------------------------------------

    return () => {
        socket.off(
            "document-joined",
            handleDocumentJoined
        );

        socket.off(
            "yjs-update",
            handleYjsUpdate
        );

        socket.off(
            "block-focused",
            handleBlockFocused
        );

        socket.off(
            "block-blurred",
            handleBlockBlurred
        );

        socket.off(
            "cursor-position",
            handleCursorPosition
        );

        socket.off(
            "document-users",
            handleDocumentUsers
        );

        socket.off(
            "user-joined-document",
            handleUserJoinedDocument
        );

        socket.off(
            "user-left-document",
            handleUserLeftDocument
        );

        socket.off(
            "document-error",
            handleDocumentError
        );
    };
}, []);
    // ========================================
    // CREATE DOCUMENT
    // ========================================

    const createDocument = async (event) => {
        event.preventDefault();

        if (!newDocumentTitle.trim()) {
            setMessage(
                "Please enter a document title."
            );

            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        title:
                            newDocumentTitle.trim(),

                        nodes: [
                            {
                                type: "paragraph",
                                content: "",
                                children: [],
                            },
                        ],
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to create document"
                );
            }

            setNewDocumentTitle("");
            setShowCreateForm(false);

            setMessage(
                "Document created successfully."
            );

            await fetchDocuments();

            openDocument(data);
        } catch (error) {
            setMessage(
                error.message
            );
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // OPEN DOCUMENT
    // ========================================

    const openDocument = (document) => {
        // ----------------------------------------
        // LEAVE PREVIOUS DOCUMENT
        // ----------------------------------------

        if (
            joinedDocumentId.current &&
            joinedDocumentId.current !==
                document._id
        ) {
            socket.emit(
                "leave-document",
                joinedDocumentId.current
            );

            removeYDocument(
                joinedDocumentId.current
            );
            setActiveCollaborators({});
setConnectedUsers({});
setCursorPositions({});
setCollaboratorNames({});
setActiveBlockId(null);
        }

        // ----------------------------------------
        // SET CURRENT DOCUMENT
        // ----------------------------------------

        setSelectedDocument(document);

        setActiveBlockId(null);
        
        setTitle(
            document.title
        );

        setNodes(
            document.nodes || []
        );

        setMessage("");

        setHasUnsavedChanges(false);

        joinedDocumentId.current =
            document._id;

        // ----------------------------------------
        // GET YJS DOCUMENT
        // ----------------------------------------

        const ydoc =
            getYDocument(
                document._id
            );

        console.log(
            "Yjs document created:",
            ydoc
        );

        // ----------------------------------------
        // GET COLLABORATION MANAGER
        // ----------------------------------------

        const manager =
            getDocumentManager(
                document._id
            );

        // ----------------------------------------
        // LOCAL YJS UPDATE LISTENER
        // ----------------------------------------

        if (
    manager &&
    !manager.updateListener
) {
    const syncDocListener = (
        update,
        origin
    ) => {
        // Ignore updates created while
        // applying remote/server state.
        if (
            manager.remoteUpdate ||
            origin === REMOTE_ORIGIN
        ) {
            console.log(
                "Ignoring remote Yjs update"
            );

            return;
        }

        // Send only genuine local changes
        // to the collaboration server.
        console.log(
            "Sending local Yjs update:",
            document._id
        );

        socket.emit(
            "yjs-update",
            {
                documentId:
                    document._id,

                update:
                    Array.from(update),
            }
        );
    };

    // Store the listener so it can be
    // removed when the document is closed.
    manager.updateListener =
        syncDocListener;

    ydoc.on(
        "update",
        syncDocListener
    );
}
socket.emit(
    "join-document",
    {
        documentId: document._id,
        clientId,
        collaboratorName,
    }
);
        
    };

    // ========================================
    // CLOSE EDITOR
    // ========================================
    const closeEditor = () => {
        if (selectedDocument) {
            socket.emit(
                "leave-document",
                selectedDocument._id
            );

            removeYDocument(
                selectedDocument._id
            );
setActiveCollaborators({});
setConnectedUsers({});
setCursorPositions({});
setCollaboratorNames({});
        }

        joinedDocumentId.current =
            null;

        setSelectedDocument(null);

        setTitle("");

        setNodes([]);

        setMessage("");

        setHasUnsavedChanges(false);
    };

    // ========================================
    // ADD NEW BLOCK
    // ========================================

    const addBlock = (
        type = "paragraph"
    ) => {
        if (!selectedDocument) {
            return;
        }

        const ydoc =
            getYDocument(
                selectedDocument._id
            );

        const blocksArray =
            ydoc.getArray("blocks");

        const newBlock =
            new Y.Map();

        newBlock.set(
            "id",
            `block-${Date.now()}`
        );

        newBlock.set(
            "type",
            type
        );

        newBlock.set(
            "content",
            ""
        );

        newBlock.set(
            "children",
            JSON.stringify([])
        );

        newBlock.set(
            "atomic",
            false
        );

        blocksArray.push([
            newBlock,
        ]);

        setNodes(
            getNodesFromYDoc(
                ydoc
            )
        );

        setHasUnsavedChanges(true);
    };
// ========================================
// DUPLICATE ACTIVE BLOCK
// ========================================

const duplicateBlock = (index) => {
    if (!selectedDocument) {
        return;
    }

    const ydoc =
        getYDocument(
            selectedDocument._id
        );

    const blocksArray =
        ydoc.getArray("blocks");

    const sourceBlock =
        blocksArray.get(index);

    if (!sourceBlock) {
        return;
    }

    const duplicatedBlock =
        new Y.Map();

    duplicatedBlock.set(
        "id",
        `block-${Date.now()}`
    );

    duplicatedBlock.set(
        "type",
        sourceBlock.get("type") ||
            "paragraph"
    );

    duplicatedBlock.set(
        "content",
        sourceBlock.get("content") ||
            ""
    );

    duplicatedBlock.set(
        "children",
        sourceBlock.get("children") ||
            JSON.stringify([])
    );

    duplicatedBlock.set(
        "atomic",
        Boolean(
            sourceBlock.get("atomic")
        )
    );

    blocksArray.insert(
        index + 1,
        [duplicatedBlock]
    );

    setNodes(
        getNodesFromYDoc(
            ydoc
        )
    );

    setHasUnsavedChanges(true);

    setActiveBlockId(
        duplicatedBlock.get("id")
    );
};
// ========================================
// MOVE BLOCK UP
// ========================================

const moveBlockUp = (index) => {
    if (!selectedDocument || index <= 0) {
        return;
    }

    const ydoc =
        getYDocument(
            selectedDocument._id
        );

    const blocksArray =
        ydoc.getArray("blocks");

    const currentBlock =
        blocksArray.get(index);

    const previousBlock =
        blocksArray.get(index - 1);

    if (
        !currentBlock ||
        !previousBlock
    ) {
        return;
    }

    const currentBlockData =
        currentBlock.toJSON();

    const previousBlockData =
        previousBlock.toJSON();

    blocksArray.delete(
        index - 1,
        2
    );

    const newCurrentBlock =
        new Y.Map();

    Object.entries(
        currentBlockData
    ).forEach(
        ([key, value]) => {
            newCurrentBlock.set(
                key,
                value
            );
        }
    );

    const newPreviousBlock =
        new Y.Map();

    Object.entries(
        previousBlockData
    ).forEach(
        ([key, value]) => {
            newPreviousBlock.set(
                key,
                value
            );
        }
    );

    blocksArray.insert(
        index - 1,
        [
            newCurrentBlock,
            newPreviousBlock,
        ]
    );

    setNodes(
        getNodesFromYDoc(
            ydoc
        )
    );

    setHasUnsavedChanges(true);

    setActiveBlockId(
        currentBlockData.id
    );
};
// ========================================
// MOVE BLOCK DOWN
// ========================================

const moveBlockDown = (index) => {
    if (!selectedDocument) {
        return;
    }

    const ydoc =
        getYDocument(
            selectedDocument._id
        );

    const blocksArray =
        ydoc.getArray("blocks");

    if (
        index < 0 ||
        index >= blocksArray.length - 1
    ) {
        return;
    }

    const currentBlock =
        blocksArray.get(index);

    const nextBlock =
        blocksArray.get(index + 1);

    if (
        !currentBlock ||
        !nextBlock
    ) {
        return;
    }

    const currentBlockData =
        currentBlock.toJSON();

    const nextBlockData =
        nextBlock.toJSON();

    blocksArray.delete(
        index,
        2
    );

    const newNextBlock =
        new Y.Map();

    Object.entries(
        nextBlockData
    ).forEach(
        ([key, value]) => {
            newNextBlock.set(
                key,
                value
            );
        }
    );

    const newCurrentBlock =
        new Y.Map();

    Object.entries(
        currentBlockData
    ).forEach(
        ([key, value]) => {
            newCurrentBlock.set(
                key,
                value
            );
        }
    );

    blocksArray.insert(
        index,
        [
            newNextBlock,
            newCurrentBlock,
        ]
    );

    setNodes(
        getNodesFromYDoc(
            ydoc
        )
    );

    setHasUnsavedChanges(true);

    setActiveBlockId(
        currentBlockData.id
    );
};
    // ========================================
    // UPDATE BLOCK
    // ========================================

    const updateBlock = (
        index,
        updatedBlock
    ) => {
        if (!selectedDocument) {
            return;
        }

        const ydoc =
            getYDocument(
                selectedDocument._id
            );

        const blocksArray =
            ydoc.getArray("blocks");

        const yBlock =
            blocksArray.get(index);

        if (yBlock) {
            yBlock.set(
                "type",
                updatedBlock.type
            );

            yBlock.set(
                "content",
                updatedBlock.content
            );

            yBlock.set(
                "children",
                JSON.stringify(
                    updatedBlock.children ||
                        []
                )
            );

            yBlock.set(
                "atomic",
                Boolean(updatedBlock.atomic)
            );
        }

        setNodes(
            (currentNodes) =>
                currentNodes.map(
                    (
                        block,
                        blockIndex
                    ) =>
                        blockIndex ===
                        index
                            ? updatedBlock
                            : block
                )
        );

        setHasUnsavedChanges(true);
    };

    // ========================================
    // ATOMIC BLOCK
    // ========================================

    const handleAtomicChange = (
        index,
        isAtomic
    ) => {
        if (!selectedDocument) {
            return;
        }

        const ydoc =
            getYDocument(
                selectedDocument._id
            );

        const blocksArray =
            ydoc.getArray("blocks");

        const yBlock =
            blocksArray.get(index);

        if (!yBlock) {
            return;
        }

        yBlock.set(
            "atomic",
            Boolean(isAtomic)
        );

        const blockId =
            yBlock.get("id") ||
            `block-${index + 1}`;

        setAtomicBlocks(
            (current) => ({
                ...current,
                [blockId]: Boolean(isAtomic),
            })
        );

        setNodes(
            getNodesFromYDoc(ydoc)
        );

        setHasUnsavedChanges(true);
    };

    // ========================================
// DELETE BLOCK
// ========================================

const deleteBlock = (
    index
) => {
    if (!selectedDocument) {
        return;
    }

    const ydoc =
        getYDocument(
            selectedDocument._id
        );

    const blocksArray =
        ydoc.getArray("blocks");

    const deletedBlock =
        blocksArray.get(index);

    const deletedBlockId =
        deletedBlock?.get("id") ||
        `block-${index + 1}`;

    blocksArray.delete(
        index,
        1
    );

    setNodes(
        getNodesFromYDoc(
            ydoc
        )
    );

    setActiveBlockId(
        (current) =>
            current ===
            deletedBlockId
                ? null
                : current
    );

    setHasUnsavedChanges(true);
};
    // ========================================
    // SAVE DOCUMENT
    // ========================================

    const saveDocument = async () => {
        if (!selectedDocument) {
            return;
        }

        if (!title.trim()) {
            setMessage(
                "Document title cannot be empty."
            );

            return;
        }

        try {
            setLoading(true);

            const response =
                await fetch(
                    `${API_URL}/${selectedDocument._id}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            title:
                                title.trim(),

                            nodes,
                        }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to save document"
                );
            }

            setSelectedDocument(
                data
            );

            setTitle(
                data.title
            );

            setNodes(
                data.nodes || []
            );

            setHasUnsavedChanges(
                false
            );

            await fetchDocuments();

            setMessage(
                "Document saved successfully."
            );
        } catch (error) {
            setMessage(
                error.message
            );
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // DELETE DOCUMENT
    // ========================================

    const deleteDocument = async () => {
        if (!selectedDocument) {
            return;
        }

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this document?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setLoading(true);

            const response =
                await fetch(
                    `${API_URL}/${selectedDocument._id}`,
                    {
                        method: "DELETE",
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to delete document"
                );
            }

            closeEditor();

            await fetchDocuments();

            setMessage(
                "Document deleted successfully."
            );
        } catch (error) {
            setMessage(
                error.message
            );
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // RENDER UI
    // ========================================

    return (
        <div className="app">

            {/* ================================= */}
            {/* HEADER */}
            {/* ================================= */}

            <header className="app-header">

                <div>
                    <h1>
                        SyncDoc
                    </h1>

                    <p>
                        Collaborative Document Engine
                    </p>
                </div>

                <button
                    className="primary-button"
                    onClick={() =>
                        setShowCreateForm(
                            true
                        )
                    }
                >
                    + New Document
                </button>

            </header>

            {/* ================================= */}
            {/* STATUS MESSAGE */}
            {/* ================================= */}

            {message && (
                <div className="status-message">
                    {message}
                </div>
            )}

            {/* ================================= */}
            {/* CREATE DOCUMENT FORM */}
            {/* ================================= */}

            {showCreateForm && (
                <div className="create-form-container">

                    <form
                        onSubmit={
                            createDocument
                        }
                    >

                        <h2>
                            Create New Document
                        </h2>

                        <input
                            type="text"
                            value={
                                newDocumentTitle
                            }
                            onChange={(
                                event
                            ) =>
                                setNewDocumentTitle(
                                    event
                                        .target
                                        .value
                                )
                            }
                            placeholder="Enter document title"
                            autoFocus
                        />

                        <div className="form-actions">

                            <button
                                type="submit"
                                className="primary-button"
                            >
                                Create
                            </button>

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => {
                                    setShowCreateForm(
                                        false
                                    );

                                    setNewDocumentTitle(
                                        ""
                                    );
                                }}
                            >
                                Cancel
                            </button>

                        </div>

                    </form>

                </div>
            )}

            {/* ================================= */}
            {/* MAIN WORKSPACE */}
            {/* ================================= */}

            <main className="workspace">

                {/* ================================= */}
                {/* DOCUMENT SIDEBAR */}
                {/* ================================= */}

                <aside className="document-sidebar">

                    <div className="sidebar-header">

                        <div>

                            <h2>
                                My Documents
                            </h2>

                            <span>
                                {
                                    documents.length
                                }{" "}
                                document
                                {
                                    documents.length !==
                                    1
                                        ? "s"
                                        : ""
                                }
                            </span>

                        </div>

                    </div>

                    {loading &&
                    documents.length ===
                        0 ? (

                        <p className="empty-message">
                            Loading documents...
                        </p>

                    ) : documents.length ===
                      0 ? (

                        <p className="empty-message">
                            No documents yet.
                        </p>

                    ) : (

                        <div className="document-list">

                            {documents.map(
                                (document) => (

                                    <button
                                        key={
                                            document._id
                                        }
                                        className={`document-card ${
                                            selectedDocument?._id ===
                                            document._id
                                                ? "active"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            openDocument(
                                                document
                                            )
                                        }
                                    >

                                        <strong>
                                            {
                                                document.title
                                            }
                                        </strong>

                                        <span>
                                            {
                                                document
                                                    .nodes
                                                    ?.length ||
                                                0
                                            }{" "}
                                            block
                                            {
                                                document
                                                    .nodes
                                                    ?.length !==
                                                1
                                                    ? "s"
                                                    : ""
                                            }
                                        </span>

                                    </button>

                                )
                            )}

                        </div>

                    )}

                </aside>

                {/* ================================= */}
                {/* EDITOR */}
                {/* ================================= */}

                <section className="editor-workspace">

                    {!selectedDocument ? (

                        <div className="editor-empty">

                            <div className="empty-icon">
                                📄
                            </div>

                            <h2>
                                Select a document
                            </h2>

                            <p>
                                Choose a document from
                                the sidebar to start
                                editing.
                            </p>

                        </div>

                    ) : (

                        <>

                            {/* ========================= */}
                            {/* EDITOR HEADER */}
                            {/* ========================= */}

                            <div className="editor-header">

                                <div className="editor-title-section">

                                    <input
                                        className="document-title-input"
                                        value={
                                            title
                                        }
                                       onChange={(event) => {
    const newTitle =
        event.target.value;

    setTitle(newTitle);

    setHasUnsavedChanges(
        true
    );

    if (selectedDocument) {
        const ydoc =
            getYDocument(
                selectedDocument._id
            );

        ydoc
            .getMap("document")
            .set(
                "title",
                newTitle
            );
    }
}}
                                        placeholder="Document title"
                                    />

                                    <div className="editor-status">

                                        <span>
                                            {
                                                nodes.length
                                            }{" "}
                                            block
                                            {
                                                nodes.length !==
                                                1
                                                    ? "s"
                                                    : ""
                                            }
                                        </span>

                                       <span className="collaborator-count">
    ● {Object.keys(connectedUsers).length + 1} users online
</span>
                                        
                                        <span
                                            className={
                                                hasUnsavedChanges
                                                    ? "save-status unsaved"
                                                    : "save-status saved"
                                            }
                                        >
                                            {hasUnsavedChanges
                                                ? "● Unsaved changes"
                                                : "✓ All changes saved"}
                                        </span>

                                    </div>

                                </div>

                                <div className="editor-actions">

                                 <button
    className="secondary-button"
    onClick={() => {
        window.open(
            `http://localhost:5000/api/documents/${selectedDocument._id}/export/html`,
            "_blank"
        );
    }}
>
    Export HTML
</button>

<button
    className="secondary-button"
    onClick={() => {
        window.open(
            `http://localhost:5000/api/documents/${selectedDocument._id}/export/pdf`,
            "_blank"
        );
    }}
>
    Export PDF
</button>

<button
    className="secondary-button"
    onClick={
        closeEditor
    }
>
    Close
</button>
                                    <button
                                        className="danger-button"
                                        onClick={
                                            deleteDocument
                                        }
                                    >
                                        Delete
                                    </button>

                                    <button
                                        className="primary-button"
                                        onClick={
                                            saveDocument
                                        }
                                        disabled={
                                            loading
                                        }
                                    >
                                        {loading
                                            ? "Saving..."
                                            : "Save"}
                                    </button>

                                </div>

                            </div>

                            {/* ========================= */}
                            {/* BLOCK TOOLBAR */}
                            {/* ========================= */}

                            <div className="block-add-toolbar">

                                <span>
                                    Add block:
                                </span>

                                <button
                                    onClick={() =>
                                        addBlock(
                                            "paragraph"
                                        )
                                    }
                                >
                                    + Paragraph
                                </button>

                                <button
                                    onClick={() =>
                                        addBlock(
                                            "heading"
                                        )
                                    }
                                >
                                    + Heading
                                </button>

                                <button
                                    onClick={() =>
                                        addBlock(
                                            "list"
                                        )
                                    }
                                >
                                    + List
                                </button>

                                <button
                                    onClick={() =>
                                        addBlock(
                                            "code"
                                        )
                                    }
                                >
                                    + Code
                                </button>

                            </div>

                            {/* ========================= */}
                            {/* BLOCKS */}
                            {/* ========================= */}

                            <div className="blocks-container">

                                {nodes.length ===
                                0 ? (

                                    <div className="no-blocks">

                                        <p>
                                            This document
                                            has no blocks
                                            yet.
                                        </p>

                                        <button
                                            className="primary-button"
                                            onClick={() =>
                                                addBlock(
                                                    "paragraph"
                                                )
                                            }
                                        >
                                            Add Paragraph
                                        </button>

                                    </div>

                                ) : (

                                    nodes.map(
                                        (
                                            block,
                                            index
                                        ) => (

                                           <div
    style={{
        border:
            activeBlockId ===
            (block.id ||
                `block-${index + 1}`)
                ? "2px solid #2563eb"
                : "2px solid transparent",
        borderRadius: "10px",
        padding: "2px",
        transition:
            "border-color 0.15s ease",
    }}
>
    <Block
        key={`${selectedDocument._id}-${block.id || `block-${index + 1}`}`}
        block={block}
        index={index}
        totalBlocks={nodes.length}
  onChange={updateBlock}
onDelete={deleteBlock}
onDuplicate={() =>
    duplicateBlock(index)
}
onMoveUp={() =>
    moveBlockUp(index)
}
onMoveDown={() =>
    moveBlockDown(index)
}
onFocus={(blockIndex, blockId) => {
    const currentBlockId =
        blockId ||
        `block-${blockIndex + 1}`;

    setActiveBlockId(
        currentBlockId
    );

    socket.emit("block-focus", {
        documentId:
            selectedDocument._id,
        blockId:
            currentBlockId,
        clientId,
    });
}}
onBlur={(blockIndex, blockId) => {
    const currentBlockId =
        blockId ||
        `block-${blockIndex + 1}`;

    setActiveBlockId(
        (current) =>
            current ===
            currentBlockId
                ? null
                : current
    );

    socket.emit("block-blur", {
        documentId:
            selectedDocument._id,
        blockId:
            currentBlockId,
        clientId,
    });
}}
       onCursorChange={(
    blockIndex,
blockId,
cursorPosition,
selectionEnd
) => {
    socket.emit("cursor-position", {
        documentId:
            selectedDocument._id,
        blockId:
            blockId || `block-${blockIndex + 1}`,
        cursorPosition,
        selectionEnd,
        clientId,
        collaboratorName,
    });
}}
    isCollaboratorActive={
        Boolean(
            activeCollaborators[
                block.id ||
                    `block-${index + 1}`
            ]
        )
    }
   collaboratorId={
    activeCollaborators[
        block.id ||
            `block-${index + 1}`
    ]
}
remoteCursorPosition={
    cursorPositions[
        block.id ||
            `block-${index + 1}`
    ]?.position
}

remoteSelectionEnd={
    cursorPositions[
        block.id ||
            `block-${index + 1}`
    ]?.selectionEnd
}

collaboratorName={
    cursorPositions[
        block.id ||
            `block-${index + 1}`
    ]?.collaboratorName
}
isAtomic={Boolean(block.atomic)}
        onAtomicChange={handleAtomicChange}
    />
</div>

                                        )
                                    )

                                )}

                            </div>

                        </>

                    )}

                </section>

            </main>

                    </div>
    );
}

export default App;