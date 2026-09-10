import React from "react";

function Block({
    block,
    index,
    onChange,
    onDelete,
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

    const renderEditor = () => {
        if (block.type === "code") {
            return (
                <textarea
                    className="block-content code-block"
                    value={block.content}
                    onChange={handleChange}
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
                placeholder={`Write ${block.type}...`}
                rows={block.type === "paragraph" ? 3 : 2}
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
                    <option value="paragraph">Paragraph</option>
                    <option value="heading">Heading</option>
                    <option value="list">List</option>
                    <option value="listItem">List Item</option>
                    <option value="code">Code</option>
                </select>

                <span className="block-number">
                    Block {index + 1}
                </span>

                <button
                    type="button"
                    className="delete-block-button"
                    onClick={() => onDelete(index)}
                >
                    Delete
                </button>
            </div>

            {renderEditor()}
        </div>
    );
}

export default Block;