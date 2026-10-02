import React, { useEffect, useRef } from "react";

function Block({
    block,
    index,
    totalBlocks,
    activeBlockId,
    onAddBlock,
    onUndo,
    onRedo,
    onChange,
    onDelete,
    onDuplicate,
    onMoveUp,
    onMoveDown,
    onFocus,
    onBlur,
    onCursorChange,
    isCollaboratorActive,
    collaboratorId,
    collaboratorName,
    remoteCursorPosition,
    remoteSelectionEnd,
    isAtomic,
    onAtomicChange,
}) {
    const blockId =
        block.id || `block-${index + 1}`;

    const textareaRef = useRef(null);

    useEffect(() => {
        if (
            activeBlockId &&
            activeBlockId === blockId &&
            textareaRef.current
        ) {
            textareaRef.current.focus();
        }
    }, [activeBlockId, blockId]);

    const atomicState =
        isAtomic !== undefined
            ? Boolean(isAtomic)
            : Boolean(block.atomic);

    const handleChange = (event) => {
        onChange(index, {
            ...block,
            content: event.target.value,
        });
    };

    const handleCursorChange = (event) => {
        const textarea = event.target;

        const cursorPosition =
            textarea.selectionStart;

        const selectionEnd =
            textarea.selectionEnd;

        if (onCursorChange) {
            onCursorChange(
                index,
                blockId,
                cursorPosition,
                selectionEnd
            );
        }
    };

    // ========================================
    // KEYBOARD SHORTCUTS
    // ========================================

    const handleKeyDown = (event) => {
        // Ctrl + Z → Undo
        if (
            event.ctrlKey &&
            !event.shiftKey &&
            event.key.toLowerCase() === "z"
        ) {
            event.preventDefault();

            if (onUndo) {
                onUndo();
            }

            return;
        }

        // Ctrl + Y → Redo
        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "y"
        ) {
            event.preventDefault();

            if (onRedo) {
                onRedo();
            }

            return;
        }

        // Ctrl + Enter → Add new block
        if (
            event.ctrlKey &&
            event.key === "Enter"
        ) {
            event.preventDefault();

            if (onAddBlock) {
                onAddBlock(index);
            }

            return;
        }

        // Ctrl + Shift + Arrow Up
        if (
            event.ctrlKey &&
            event.shiftKey &&
            event.key === "ArrowUp"
        ) {
            event.preventDefault();

            if (onMoveUp && index > 0) {
                onMoveUp();
            }

            return;
        }

        // Ctrl + Shift + Arrow Down
        if (
            event.ctrlKey &&
            event.shiftKey &&
            event.key === "ArrowDown"
        ) {
            event.preventDefault();

            if (
                onMoveDown &&
                index < totalBlocks - 1
            ) {
                onMoveDown();
            }
        }
    };

    const handleTypeChange = (event) => {
        onChange(index, {
            ...block,
            type: event.target.value,
        });
    };

    const handleAtomicChange = (event) => {
        if (onAtomicChange) {
            onAtomicChange(
                index,
                event.target.checked
            );
        }
    };

    const handleFocus = () => {
        if (onFocus) {
            onFocus(index, blockId);
        }
    };

    const handleBlur = () => {
        if (onBlur) {
            onBlur(index, blockId);
        }
    };

    const renderRemoteCursor = () => {
        if (
            remoteCursorPosition === undefined ||
            remoteCursorPosition === null ||
            remoteCursorPosition < 0 ||
            remoteCursorPosition >
                block.content.length
        ) {
            return null;
        }

        return (
            <div className="remote-cursor-indicator">

                <span className="remote-cursor-dot">
                    ●
                </span>

                <span className="remote-cursor-label">
                    {collaboratorName ||
                        "Collaborator"}
                </span>

                <span className="remote-cursor-id">
                    {collaboratorId
                        ? collaboratorId.slice(-6)
                        : "User"}
                </span>

                <span className="remote-cursor-position">
                    Position {remoteCursorPosition}
                </span>

                {remoteSelectionEnd !==
                    undefined &&
                    remoteSelectionEnd !==
                        null &&
                    remoteSelectionEnd !==
                        remoteCursorPosition && (
                        <span className="remote-selection-position">
                            Selection{" "}
                            {remoteCursorPosition}–
                            {remoteSelectionEnd}
                        </span>
                    )}

            </div>
        );
    };

    const renderEditor = () => {
        if (block.type === "code") {
            return (
                <textarea
                    ref={textareaRef}
                    className="block-content code-block"
                    value={block.content}
                    onChange={handleChange}
                    onSelect={handleCursorChange}
                    onKeyDown={handleKeyDown}
                    onClick={handleCursorChange}
                    onKeyUp={handleCursorChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="Write code..."
                    rows={6}
                />
            );
        }

        return (
            <textarea
                ref={textareaRef}
                className={`block-content ${block.type}-block`}
                value={block.content}
                onChange={handleChange}
                onSelect={handleCursorChange}
                onKeyDown={handleKeyDown}
                onClick={handleCursorChange}
                onKeyUp={handleCursorChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={`Write ${block.type}...`}
                rows={
                    block.type === "paragraph"
                        ? 3
                        : 2
                }
            />
        );
    };

    return (
        <div
            className={`editor-block${
                atomicState
                    ? " atomic-block"
                    : ""
            }`}
            data-block-id={blockId}
        >

            {/* ================================= */}
            {/* BLOCK TOOLBAR */}
            {/* ================================= */}

            <div className="block-toolbar">

                <div className="block-toolbar-left">

                    <span className="block-drag-handle">
                        ⋮⋮
                    </span>

                    <span className="block-number">
                        Block {index + 1}
                    </span>

                    <select
                        value={block.type}
                        onChange={handleTypeChange}
                        className="block-type"
                        aria-label="Block type"
                    >
                        <option value="paragraph">
                            Paragraph
                        </option>

                        <option value="heading">
                            Heading
                        </option>

                        <option value="list">
                            List
                        </option>

                        <option value="listItem">
                            List Item
                        </option>

                        <option value="code">
                            Code
                        </option>
                    </select>

                </div>


                <div className="block-toolbar-right">

                    {/* ATOMIC */}

                    <label className="atomic-block-control">

                        <input
                            type="checkbox"
                            checked={atomicState}
                            onChange={
                                handleAtomicChange
                            }
                        />

                        <span>
                            Atomic
                        </span>

                    </label>


                    {atomicState && (
                        <span className="atomic-block-indicator">
                            <span className="atomic-status-dot">
                                ●
                            </span>

                            Atomic
                        </span>
                    )}


                    {/* COLLABORATOR */}

                    {isCollaboratorActive && (
                        <span className="collaborator-indicator">

                            <span className="collaborator-status-dot">
                                ●
                            </span>

                            Collaborator editing

                            {collaboratorId && (
                                <span className="collaborator-id">
                                    {" "}
                                    (
                                    {collaboratorId.slice(
                                        -6
                                    )}
                                    )
                                </span>
                            )}

                        </span>
                    )}


                    {/* MOVE */}

                    <button
                        type="button"
                        className="block-action-button"
                        onClick={() => {
                            if (onMoveUp) {
                                onMoveUp();
                            }
                        }}
                        disabled={index === 0}
                        title="Move block up"
                    >
                        ↑
                    </button>


                    <button
                        type="button"
                        className="block-action-button"
                        onClick={() => {
                            if (onMoveDown) {
                                onMoveDown();
                            }
                        }}
                        disabled={
                            index ===
                            totalBlocks - 1
                        }
                        title="Move block down"
                    >
                        ↓
                    </button>


                    {/* DUPLICATE */}

                    <button
                        type="button"
                        className="block-action-button"
                        onClick={() => {
                            if (onDuplicate) {
                                onDuplicate();
                            }
                        }}
                        title="Duplicate block"
                    >
                        ⧉
                    </button>


                    {/* DELETE */}

                    <button
                        type="button"
                        className="block-delete-button"
                        onClick={() =>
                            onDelete(index)
                        }
                        title="Delete block"
                    >
                        ×
                    </button>

                </div>

            </div>


            {/* ================================= */}
            {/* BLOCK EDITOR */}
            {/* ================================= */}

            <div className="block-editor-area">

                {renderEditor()}

            </div>


            {/* ================================= */}
            {/* REMOTE CURSOR */}
            {/* ================================= */}

            {remoteCursorPosition !==
                undefined &&
                remoteCursorPosition !==
                    null &&
                renderRemoteCursor()}

        </div>
    );
}

export default Block;