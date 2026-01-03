// src/utils/pdfGenerator.js
import jsPDF from "jspdf";

export class PDFGenerator {
  static async generateDocument(headerText, subTitleText, projects) {
    try {
      const pdf = new jsPDF("p", "mm", "a4");

      // Process each project
      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];

        // Add new page for subsequent projects
        if (i > 0) {
          pdf.addPage();
        }

        let yPosition = 20;

        // Header text - centered (BESAR)
        pdf.setFontSize(24);
        pdf.setFont("helvetica", "bold");
        const titleText = project.name || `${headerText} ${i + 1}`;
        const titleWidth = pdf.getTextWidth(titleText);
        const pageWidth = 210; // A4 width in mm
        pdf.text(titleText, (pageWidth - titleWidth) / 2, yPosition);
        yPosition += 15;

        // Sub title text (smaller, centered)
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "normal");
        const subTitleWidth = pdf.getTextWidth(subTitleText);
        pdf.text(subTitleText, (pageWidth - subTitleWidth) / 2, yPosition);
        yPosition += 15;

        // Determine project mode
        const mode = project.mode || "beforeAfter";

        if (mode === "progress") {
          // Progress Mode (0%, 50%, 100%)
          const progressLevels = ["0%", "50%", "100%"];
          for (const level of progressLevels) {
            if (
              project.progressPhotos &&
              project.progressPhotos[level] &&
              project.progressPhotos[level].length > 0
            ) {
              yPosition = await this.addPhotoSection(
                pdf,
                `PROGRESS ${level}`,
                project.progressPhotos[level],
                yPosition
              );
            }
          }
        } else {
          // Before/After Mode
          // Before Photos Section
          if (project.beforePhotos && project.beforePhotos.length > 0) {
            yPosition = await this.addPhotoSection(
              pdf,
              "BEFORE (Sebelum)",
              project.beforePhotos,
              yPosition
            );
          }

          // After Photos Section
          if (project.afterPhotos && project.afterPhotos.length > 0) {
            // Check if we need a new page
            if (yPosition > 200) {
              pdf.addPage();
              yPosition = 20;

              // Repeat project title on new page
              pdf.setFontSize(18);
              pdf.setFont("helvetica", "bold");
              pdf.text(titleText, pageWidth / 2, yPosition, {
                align: "center",
              });
              yPosition += 15;
            }

            yPosition = await this.addPhotoSection(
              pdf,
              "AFTER (Sesudah)",
              project.afterPhotos,
              yPosition
            );
          }
        }
      }

      return pdf;
    } catch (error) {
      console.error("Error creating PDF:", error);
      throw error;
    }
  }

  static async addPhotoSection(pdf, sectionTitle, photos, startY) {
    let yPosition = startY;
    const pageWidth = 210;
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    // Section title - center aligned
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    const titleWidth = pdf.getTextWidth(sectionTitle);
    pdf.text(sectionTitle, (pageWidth - titleWidth) / 2, yPosition);
    yPosition += 10;

    // Draw section line - center aligned
    const lineWidth = contentWidth * 0.8; // 80% of content width
    const lineStartX = (pageWidth - lineWidth) / 2;
    pdf.setLineWidth(0.5);
    pdf.line(lineStartX, yPosition, lineStartX + lineWidth, yPosition);
    yPosition += 8;

    // Calculate photo layout (2 columns, centered)
    const cols = 2;
    const gap = 5;
    const photoWidth = (contentWidth - gap) / cols;
    const photoHeight = photoWidth * 0.75; // 4:3 aspect ratio

    // Calculate starting X to center the grid
    const gridWidth = photoWidth * cols + gap;
    const gridStartX = (pageWidth - gridWidth) / 2;

    for (let i = 0; i < photos.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      // Check if we need a new page
      if (yPosition + photoHeight > 277) {
        // 277 = page height - bottom margin
        pdf.addPage();
        yPosition = 20;

        // Repeat section title (centered)
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        const repeatTitleWidth = pdf.getTextWidth(sectionTitle + " (lanjutan)");
        pdf.text(
          sectionTitle + " (lanjutan)",
          (pageWidth - repeatTitleWidth) / 2,
          yPosition
        );
        yPosition += 10;
      }

      const x = gridStartX + col * (photoWidth + gap);
      const y = yPosition + (row > 0 && col === 0 ? gap : 0);

      // If starting a new row (and not first row), add spacing
      if (col === 0 && i > 0) {
        yPosition = y;
      }

      try {
        // Draw photo border
        pdf.setLineWidth(0.3);
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(x, y, photoWidth, photoHeight);

        // Add photo
        pdf.addImage(
          photos[i].data,
          "JPEG",
          x + 1,
          y + 1,
          photoWidth - 2,
          photoHeight - 2
        );
      } catch (err) {
        console.error("Error adding image:", err);
        // Draw placeholder
        pdf.setFillColor(240, 240, 240);
        pdf.rect(x, y, photoWidth, photoHeight, "F");
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          "Foto tidak dapat dimuat",
          x + photoWidth / 2,
          y + photoHeight / 2,
          {
            align: "center",
          }
        );
      }

      // Move to next row after 2nd column
      if (col === cols - 1) {
        yPosition += photoHeight + gap;
      }
    }

    // If odd number of photos, still need to advance y
    if (photos.length % cols !== 0) {
      yPosition += photoHeight + gap;
    }

    yPosition += 10; // Extra spacing after section

    return yPosition;
  }

  static downloadPDF(pdf, filename) {
    pdf.save(filename);
  }
}
