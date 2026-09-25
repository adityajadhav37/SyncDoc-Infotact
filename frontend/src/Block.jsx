import React from "react";

function Block({
    block,
    index,
    totalBlocks,
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
            remoteCursorPosition > block.content.length
        ) {
            return null;
        }

        return (
            <div className="remote-cursor-indicator">
                <span className="remote-cursor-dot">
                    ●
                </span>

                <span className="remote-cursor-label">
                    {collaboratorName || "Collaborator"}
                </span>

                <span className="remote-cursor-id">
                    {collaboratorId
                        ? collaboratorId.slice(-6)
                        : "User"}
                </span>

                <span className="remote-cursor-position">
                    Position {remoteCursorPosition}
                </span>

                {remoteSelectionEnd !== undefined &&
                    remoteSelectionEnd !== null &&
                    remoteSelectionEnd !==
                        remoteCursorPosition && (
                        <span className="remote-selection-position">
                            Selection {remoteCursorPosition}–
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
                    className="block-content code-block"
                    value={block.content}
                    onChange={handleChange}
                    onSelect={handleCursorChange}
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
                className={`block-content ${block.type}-block`}
                value={block.content}
                onChange={handleChange}
                onSelect={handleCursorChange}
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
                atomicState ? " atomic-block" : ""
            }`}
            data-block-id={blockId}
        >
            <div className="block-toolbar">
                <select
                    value={block.type}
                    onChange={handleTypeChange}
                    className="block-type"
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

                <span className="block-number">
                    Block {index + 1}
                </span>

                <label className="atomic-block-control">
                    <input
                        type="checkbox"
                        checked={atomicState}
                        onChange={handleAtomicChange}
                    />
                    Atomic
                </label>

                {atomicState && (
                    <span className="atomic-block-indicator">
                        ● Atomic block
                    </span>
                )}

                {isCollaboratorActive && (
                    <span className="collaborator-indicator">
                        ● Collaborator editing

                        {collaboratorId && (
                            <span className="collaborator-id">
                                {" "}
                                (
                                {collaboratorId.slice(-6)}
                                )
                            </span>
                        )}
                    </span>
                )}

             <button
    type="button"
    className="move-block-button"
    onClick={() => {
        if (onMoveUp) {
            onMoveUp();
        }
    }}
    disabled={index === 0}
>
    ↑ Up
</button>
<button
    type="button"
    className="move-block-button"
    onClick={() => {
        if (onMoveDown) {
            onMoveDown();
        }
    }}
    disabled={index === totalBlocks - 1}
>
    ↓ Down
</button>

<button
    type="button"
    className="duplicate-block-button"
    onClick={() => {
        if (onDuplicate) {
            onDuplicate();
        }
    }}
>
    Duplicate
</button>

<button
    type="button"
    className="delete-block-button"
    onClick={() => onDelete(index)}
>
    Delete
</button>
            </div>

            {renderEditor()}

            {remoteCursorPosition !== undefined &&
                remoteCursorPosition !== null &&
                renderRemoteCursor()}
        </div>
    );
}

export default Block;
