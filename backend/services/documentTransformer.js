// ----------------------------------------
// SYNC DOC DOCUMENT TRANSFORMER
// ----------------------------------------
// Converts SyncDoc AST nodes into HTML.
// Handles nested document structures,
// lists, list items, headings, paragraphs,
// and code blocks.
// ----------------------------------------

const escapeHtml = (value = "") => {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// ----------------------------------------
// TRANSFORM CHILDREN
// ----------------------------------------

const transformChildren = (children = []) => {
    if (!Array.isArray(children)) {
        return "";
    }

    return children
        .map((child) => transformNode(child))
        .join("");
};

// ----------------------------------------
// TRANSFORM SINGLE AST NODE
// ----------------------------------------

const transformNode = (node) => {
    if (!node || typeof node !== "object") {
        return "";
    }

    const content = escapeHtml(
        node.content || ""
    );

    switch (node.type) {
        case "document":
            return `
                <section class="ast-document">
                    ${transformChildren(
                        node.children || []
                    )}
                </section>
            `;

        case "heading":
            return `
                <h2>
                    ${content}
                </h2>
                ${transformChildren(
                    node.children || []
                )}
            `;

        case "paragraph":
            return `
                <p>
                    ${content}
                </p>
                ${transformChildren(
                    node.children || []
                )}
            `;

       case "list":
    return `
        ${
            content
                ? `<p class="list-title">${content}</p>`
                : ""
        }

        <ul>
            ${transformChildren(
                node.children || []
            )}
        </ul>
    `;

        case "listItem":
    return `<li>${content}${transformChildren(
        node.children || []
    )}</li>`;

        case "code":
    return `<pre><code>${content}</code></pre>`;

        default:
            return "";
    }
};

// ----------------------------------------
// TRANSFORM COMPLETE DOCUMENT
// ----------------------------------------

const transformDocumentToHtml = (
    document
) => {
    if (!document) {
        throw new Error(
            "Document data is required"
        );
    }

    const title = escapeHtml(
        document.title ||
            "Untitled Document"
    );

    const nodes =
        Array.isArray(document.nodes)
            ? document.nodes
            : [];

    return `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    />

    <title>${title}</title>

    <style>
        body {
            font-family:
                Arial,
                Helvetica,
                sans-serif;

            line-height: 1.6;
            max-width: 900px;
            margin: 40px auto;
            padding: 0 20px;
            color: #1f2937;
        }

        h1 {
            margin-bottom: 30px;
        }

        h2 {
            margin-top: 24px;
        }

        p {
            margin: 12px 0;
        }

        ul {
            margin: 12px 0;
            padding-left: 30px;
        }

        li {
            margin: 6px 0;
        }

        .list-title {
            list-style: none;
            font-weight: 600;
            margin-left: -20px;
        }

        pre {
            background: #f3f4f6;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
        }

        code {
            font-family:
                Consolas,
                Monaco,
                monospace;
        }
    </style>
</head>

<body>

    <main>

        <h1>${title}</h1>

        ${transformChildren(nodes)}

    </main>

</body>

</html>
`.trim();
};

module.exports = {
    transformDocumentToHtml,
};