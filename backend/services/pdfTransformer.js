// ----------------------------------------
// SYNC DOC PDF TRANSFORMER
// ----------------------------------------
// Converts SyncDoc AST documents into PDF.
// ----------------------------------------

const PDFDocument = require("pdfkit");

// ----------------------------------------
// DRAW AST NODE
// ----------------------------------------

const drawNode = (pdf, node, depth = 0) => {
    if (!node || typeof node !== "object") {
        return;
    }

    const content = String(
        node.content || ""
    ).trim();

    switch (node.type) {
        case "document":
            drawChildren(
                pdf,
                node.children || [],
                depth
            );
            break;

        case "heading":
            pdf
                .fontSize(16)
                .font("Helvetica-Bold")
                .text(content, {
                    paragraphGap: 8,
                });

            drawChildren(
                pdf,
                node.children || [],
                depth
            );

            break;

        case "paragraph":
            pdf
                .fontSize(11)
                .font("Helvetica")
                .text(content, {
                    paragraphGap: 8,
                });

            drawChildren(
                pdf,
                node.children || [],
                depth
            );

            break;

        case "list":
            if (content) {
                pdf
                    .fontSize(11)
                    .font("Helvetica-Bold")
                    .text(content, {
                        paragraphGap: 4,
                    });
            }

            drawChildren(
                pdf,
                node.children || [],
                depth + 1
            );

            break;

        case "listItem":
            pdf
                .fontSize(11)
                .font("Helvetica")
                .text(
                    `${"    ".repeat(
                        depth
                    )}• ${content}`,
                    {
                        paragraphGap: 4,
                    }
                );

            drawChildren(
                pdf,
                node.children || [],
                depth + 1
            );

            break;

        case "code":
            pdf
                .fontSize(9)
                .font("Courier")
                .text(content, {
                    paragraphGap: 10,
                });

            break;

        default:
            break;
    }
};

// ----------------------------------------
// DRAW CHILDREN
// ----------------------------------------

const drawChildren = (
    pdf,
    children = [],
    depth = 0
) => {
    if (!Array.isArray(children)) {
        return;
    }

    children.forEach((child) => {
        drawNode(
            pdf,
            child,
            depth
        );
    });
};

// ----------------------------------------
// CREATE PDF
// ----------------------------------------

const transformDocumentToPdf = (
    document
) => {
    if (!document) {
        throw new Error(
            "Document data is required"
        );
    }

    const pdf =
        new PDFDocument({
            margin: 50,
        });

    const title = String(
        document.title ||
            "Untitled Document"
    ).trim();

    pdf
        .fontSize(22)
        .font("Helvetica-Bold")
        .text(title, {
            align: "left",
            paragraphGap: 20,
        });

    drawChildren(
        pdf,
        document.nodes || []
    );

    return pdf;
};

module.exports = {
    transformDocumentToPdf,
};