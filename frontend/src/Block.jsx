import React from "react";

function Block({
    block,
    index,
    onChange,
    onDelete,
    onFocus,
    onBlur,
    isCollaboratorActive,
    collaboratorId,
}) {
    const handleChange = (event) => {
        onChange(index, {
            ...block,
            content: event.target.value,
        });
    };

    const handleTypeChange = (event) => {
        onChange(index, {
            ...block,
            type: event.target.value,
        });
    };

 

    const handleFocus = () => {
    if (onFocus) {
        onFocus(index, block.id);
    }
};

const handleBlur = () => {
    if (onBlur) {
        onBlur(index, block.id);
    }
};
    const renderEditor = () => {
        if (block.type === "code") {
            return (
                <textarea
                    className="block-content code-block"
                    value={block.content}
                    onChange={handleChange}
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
        <div className="editor-block">
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

{isCollaboratorActive && (
    <span className="collaborator-indicator">
        ● Collaborator editing
        {collaboratorId && (
            <span className="collaborator-id">
                {" "}
                ({collaboratorId.slice(-6)})
            </span>
        )}
    </span>
)}

<button
                    type="button"
                    className="delete-block-button"
                    onClick={() =>
                        onDelete(index)
                    }
                >
                    Delete
                </button>
            </div>

            {renderEditor()}
        </div>
    );
}

export default Block;