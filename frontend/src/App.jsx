import { useEffect, useState } from "react";
import Block from "./Block";
import "./App.css";

const API_URL = "http://localhost:5000/api/documents";

function App() {
    const [documents, setDocuments] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);

    const [title, setTitle] = useState("");
    const [nodes, setNodes] = useState([]);

    const [newDocumentTitle, setNewDocumentTitle] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // Fetch all documents
    const fetchDocuments = async () => {
        try {
            setLoading(true);

            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Failed to fetch documents");
            }

            const data = await response.json();

            setDocuments(data);
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    // Create document
    const createDocument = async (event) => {
        event.preventDefault();

        if (!newDocumentTitle.trim()) {
            setMessage("Please enter a document title.");
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: newDocumentTitle.trim(),
                    nodes: [
                        {
                            type: "paragraph",
                            content: "",
                            children: [],
                        },
                    ],
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create document");
            }

            setNewDocumentTitle("");
            setShowCreateForm(false);
            setMessage("Document created successfully.");

            await fetchDocuments();

            openDocument(data);
        } catch (error) {
            setMessage(error.message);
        }
    };

    // Open document
    const openDocument = (document) => {
        setSelectedDocument(document);
        setTitle(document.title);
        setNodes(document.nodes || []);
        setMessage("");
    };

    // Close editor
    const closeEditor = () => {
        setSelectedDocument(null);
        setTitle("");
        setNodes([]);
        setMessage("");
    };

    // Add new block
    const addBlock = (type = "paragraph") => {
        const newBlock = {
            type,
            content: "",
            children: [],
        };

        setNodes((currentNodes) => [
            ...currentNodes,
            newBlock,
        ]);
    };

    // Update block
    const updateBlock = (index, updatedBlock) => {
        setNodes((currentNodes) =>
            currentNodes.map((block, blockIndex) =>
                blockIndex === index
                    ? updatedBlock
                    : block
            )
        );
    };

    // Delete block
    const deleteBlock = (index) => {
        setNodes((currentNodes) =>
            currentNodes.filter(
                (_, blockIndex) => blockIndex !== index
            )
        );
    };

    // Save document
    const saveDocument = async () => {
        if (!selectedDocument) {
            return;
        }

        if (!title.trim()) {
            setMessage("Document title cannot be empty.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/${selectedDocument._id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        title: title.trim(),
                        nodes,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to save document"
                );
            }

            setSelectedDocument(data);
            setTitle(data.title);
            setNodes(data.nodes || []);

            await fetchDocuments();

            setMessage("Document saved successfully.");
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Delete document
    const deleteDocument = async () => {
        if (!selectedDocument) {
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete this document?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/${selectedDocument._id}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to delete document"
                );
            }

            closeEditor();

            await fetchDocuments();

            setMessage("Document deleted successfully.");
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app">
            {/* Header */}
            <header className="app-header">
                <div>
                    <h1>SyncDoc</h1>
                    <p>Collaborative Document Engine</p>
                </div>

                <button
                    className="primary-button"
                    onClick={() => setShowCreateForm(true)}
                >
                    + New Document
                </button>
            </header>

            {/* Status message */}
            {message && (
                <div className="status-message">
                    {message}
                </div>
            )}

            {/* Create document form */}
            {showCreateForm && (
                <div className="create-form-container">
                    <form onSubmit={createDocument}>
                        <h2>Create New Document</h2>

                        <input
                            type="text"
                            value={newDocumentTitle}
                            onChange={(event) =>
                                setNewDocumentTitle(
                                    event.target.value
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
                                    setShowCreateForm(false);
                                    setNewDocumentTitle("");
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Main workspace */}
            <main className="workspace">
                {/* Document browser */}
                <aside className="document-sidebar">
                    <div className="sidebar-header">
                        <div>
                            <h2>My Documents</h2>
                            <span>
                                {documents.length} document
                                {documents.length !== 1 ? "s" : ""}
                            </span>
                        </div>
                    </div>

                    {loading && documents.length === 0 ? (
                        <p className="empty-message">
                            Loading documents...
                        </p>
                    ) : documents.length === 0 ? (
                        <p className="empty-message">
                            No documents yet.
                        </p>
                    ) : (
                        <div className="document-list">
                            {documents.map((document) => (
                                <button
                                    key={document._id}
                                    className={`document-card ${
                                        selectedDocument?._id ===
                                        document._id
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        openDocument(document)
                                    }
                                >
                                    <strong>
                                        {document.title}
                                    </strong>

                                    <span>
                                        {document.nodes?.length || 0}{" "}
                                        block
                                        {document.nodes?.length !== 1
                                            ? "s"
                                            : ""}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </aside>

                {/* Editor */}
                <section className="editor-workspace">
                    {!selectedDocument ? (
                        <div className="editor-empty">
                            <div className="empty-icon">
                                📄
                            </div>

                            <h2>Select a document</h2>

                            <p>
                                Choose a document from the sidebar
                                to start editing.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Editor header */}
                            <div className="editor-header">
                                <div className="editor-title-section">
                                    <input
                                        className="document-title-input"
                                        value={title}
                                        onChange={(event) =>
                                            setTitle(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Document title"
                                    />

                                    <span className="editor-status">
                                        {nodes.length} block
                                        {nodes.length !== 1
                                            ? "s"
                                            : ""}
                                    </span>
                                </div>

                                <div className="editor-actions">
                                    <button
                                        className="secondary-button"
                                        onClick={closeEditor}
                                    >
                                        Close
                                    </button>

                                    <button
                                        className="danger-button"
                                        onClick={deleteDocument}
                                    >
                                        Delete
                                    </button>

                                    <button
                                        className="primary-button"
                                        onClick={saveDocument}
                                        disabled={loading}
                                    >
                                        {loading
                                            ? "Saving..."
                                            : "Save"}
                                    </button>
                                </div>
                            </div>

                            {/* Block toolbar */}
                            <div className="block-add-toolbar">
                                <span>Add block:</span>

                                <button
                                    onClick={() =>
                                        addBlock("paragraph")
                                    }
                                >
                                    + Paragraph
                                </button>

                                <button
                                    onClick={() =>
                                        addBlock("heading")
                                    }
                                >
                                    + Heading
                                </button>

                                <button
                                    onClick={() =>
                                        addBlock("list")
                                    }
                                >
                                    + List
                                </button>

                                <button
                                    onClick={() =>
                                        addBlock("code")
                                    }
                                >
                                    + Code
                                </button>
                            </div>

                            {/* Blocks */}
                            <div className="blocks-container">
                                {nodes.length === 0 ? (
                                    <div className="no-blocks">
                                        <p>
                                            This document has no
                                            blocks yet.
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
                                        (block, index) => (
                                            <Block
                                                key={`${selectedDocument._id}-${index}`}
                                                block={block}
                                                index={index}
                                                onChange={
                                                    updateBlock
                                                }
                                                onDelete={
                                                    deleteBlock
                                                }
                                            />
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