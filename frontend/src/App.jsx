import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [showForm, setShowForm] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [documents, setDocuments] = useState([]);

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/documents")
      .then((response) => response.json())
      .then((data) => {
        setDocuments(data);
      })
      .catch((error) => {
        console.error("Failed to fetch documents:", error);
      });
  }, []);

  const createDocument = async () => {
    if (documentName.trim() === "") {
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/documents",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: documentName,
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

      if (!response.ok) {
        throw new Error("Failed to create document");
      }

      const newDocument = await response.json();

      setDocuments([newDocument, ...documents]);
      setDocumentName("");
      setShowForm(false);
    } catch (error) {
      console.error("Failed to create document:", error);
    }
  };

  const openDocument = (document) => {
    setSelectedDocument(document);
    setEditorTitle(document.title);

    if (document.nodes && document.nodes.length > 0) {
      setBlocks(document.nodes);
    } else {
      setBlocks([
        {
          type: "paragraph",
          content: "",
          children: [],
        },
      ]);
    }
  };

  const updateBlock = (index, value) => {
    const updatedBlocks = [...blocks];

    updatedBlocks[index] = {
      ...updatedBlocks[index],
      content: value,
    };

    setBlocks(updatedBlocks);
  };

  const changeBlockType = (index, type) => {
    const updatedBlocks = [...blocks];

    updatedBlocks[index] = {
      ...updatedBlocks[index],
      type: type,
    };

    setBlocks(updatedBlocks);
  };

  const addBlock = () => {
    setBlocks([
      ...blocks,
      {
        type: "paragraph",
        content: "",
        children: [],
      },
    ]);
  };

  const deleteBlock = (index) => {
    if (blocks.length === 1) {
      return;
    }

    const updatedBlocks = blocks.filter(
      (_, blockIndex) => blockIndex !== index
    );

    setBlocks(updatedBlocks);
  };

  const updateDocument = async () => {
    if (!selectedDocument) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/documents/${selectedDocument._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editorTitle,
            nodes: blocks,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update document");
      }

      const updatedDocument = await response.json();

      setDocuments(
        documents.map((document) =>
          document._id === updatedDocument._id
            ? updatedDocument
            : document
        )
      );

      setSelectedDocument(updatedDocument);

      alert("Document updated successfully!");
    } catch (error) {
      console.error("Failed to update document:", error);
      alert("Failed to update document");
    }
  };

  const deleteDocument = async (documentId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this document?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/documents/${documentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      setDocuments(
        documents.filter(
          (document) => document._id !== documentId
        )
      );

      if (selectedDocument?._id === documentId) {
        setSelectedDocument(null);
      }

      alert("Document deleted successfully!");
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Failed to delete document");
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <div className="logo">SyncDoc</div>

          <div className="subtitle">
            Collaborative Document Engine
          </div>
        </div>

        <button
          className="new-button"
          onClick={() => setShowForm(true)}
        >
          + New Document
        </button>
      </header>

      <main className="main">
        <h1 className="page-title">
          My Documents
        </h1>

        {showForm && (
          <div className="create-form">
            <h2>Create New Document</h2>

            <input
              type="text"
              placeholder="Enter document name"
              value={documentName}
              onChange={(e) =>
                setDocumentName(e.target.value)
              }
            />

            <div className="form-buttons">
              <button
                className="create-button"
                onClick={createDocument}
              >
                Create
              </button>

              <button
                className="cancel-button"
                onClick={() => {
                  setShowForm(false);
                  setDocumentName("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="documents">
          {documents.map((document) => (
            <div
              className="document-card"
              key={document._id}
            >
              <div
                onClick={() => openDocument(document)}
                style={{ cursor: "pointer" }}
              >
                <div className="document-icon">
                  📄
                </div>

                <h3>{document.title}</h3>

                <p>
                  Last edited:{" "}
                  {new Date(
                    document.updatedAt
                  ).toLocaleString()}
                </p>
              </div>

              <button
                className="delete-button"
                onClick={() =>
                  deleteDocument(document._id)
                }
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {selectedDocument && (
          <div className="editor">
            <h2>Edit Document</h2>

            <input
              type="text"
              value={editorTitle}
              onChange={(e) =>
                setEditorTitle(e.target.value)
              }
              placeholder="Document title"
            />

            <div className="blocks">
              {blocks.map((block, index) => (
                <div
                  className="block"
                  key={index}
                >
                  <div className="block-toolbar">
                    <select
                      value={block.type}
                      onChange={(e) =>
                        changeBlockType(
                          index,
                          e.target.value
                        )
                      }
                    >
                      <option value="paragraph">
                        Paragraph
                      </option>

                      <option value="heading">
                        Heading
                      </option>

                      <option value="code">
                        Code
                      </option>

                      <option value="list">
                        List
                      </option>

                      <option value="listItem">
                        List Item
                      </option>
                    </select>

                    <button
                      className="block-delete"
                      onClick={() =>
                        deleteBlock(index)
                      }
                    >
                      Remove
                    </button>
                  </div>

                  <textarea
                    value={block.content}
                    onChange={(e) =>
                      updateBlock(
                        index,
                        e.target.value
                      )
                    }
                    placeholder={`Write ${block.type} content...`}
                  />
                </div>
              ))}
            </div>

            <button
              className="add-block-button"
              onClick={addBlock}
            >
              + Add Block
            </button>

            <div className="form-buttons">
              <button
                className="create-button"
                onClick={updateDocument}
              >
                Save Changes
              </button>

              <button
                className="cancel-button"
                onClick={() =>
                  setSelectedDocument(null)
                }
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;