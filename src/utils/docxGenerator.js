import { Document, Packer, Paragraph, ImageRun, Table, TableRow, TableCell, AlignmentType, WidthType, TextRun } from 'docx';
import { saveAs } from 'file-saver';

export class DocxGenerator {
  static async generateDocument(documentTitle, projectName, projects) {
    try {
      const sections = [];
      
      // Title page
      sections.push(
        new Paragraph({
          children: [new TextRun({
            text: documentTitle,
            bold: true,
            size: 48
          })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 1000, after: 500 }
        }),
        new Paragraph({
          children: [new TextRun({
            text: projectName,
            size: 32
          })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 1000 }
        })
      );

      // Process each project
      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];
        const projectNumber = i + 1;
        
        // Add page break for subsequent projects
        if (i > 0) {
          sections.push(new Paragraph({
            children: [],
            pageBreakBefore: true
          }));
        }
        
        // Project title
        sections.push(new Paragraph({
          children: [new TextRun({
            text: `PROYEK ${projectNumber}`,
            bold: true,
            size: 36
          })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 }
        }));
        
        // Create progress table
        const table = await this.createProgressTable(project);
        sections.push(table);
      }

      return new Document({
        sections: [{
          properties: {},
          children: sections
        }]
      });
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  static async createProgressTable(project) {
    const rows = [];
    const progressLevels = ['0%', '50%', '100%'];

    for (const progress of progressLevels) {
      let imageContent;
      
      if (project.photos[progress]) {
        try {
          // Convert data URL to ArrayBuffer
          const response = await fetch(project.photos[progress].data);
          const arrayBuffer = await response.arrayBuffer();
          
          imageContent = new ImageRun({
            data: arrayBuffer,
            transformation: {
              width: 400,
              height: 600,
            },
          });
        } catch (error) {
          console.error('Error processing image:', error);
          imageContent = new TextRun({
            text: `[Error loading image for ${progress}]`,
            color: "FF0000"
          });
        }
      } else {
        imageContent = new TextRun({
          text: `[Foto ${progress} tidak tersedia]`,
          color: "888888"
        });
      }

      const row = new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({
                  text: progress,
                  bold: true,
                  size: 32
                })],
                alignment: AlignmentType.LEFT
              }),
              new Paragraph({
                children: [imageContent],
                alignment: AlignmentType.CENTER
              })
            ],
          })
        ]
      });
      
      rows.push(row);
    }

    return new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      height: {
        size: 600,
        type: HeightType.POINTS
      },
      rows: rows,
    });
  }

  static async downloadDocument(doc, filename) {
    try {
      const blob = await Packer.toBlob(doc);
      saveAs(blob, filename);
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }
}