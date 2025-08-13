import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface BookChapter {
  chapter_number: number;
  title: string;
  content: string;
  word_count: number;
  images: Array<{
    caption: string;
    data: string;
    source: string;
  }>;
}

interface BookMetadata {
  title: string;
  author: string;
  genre: string;
  total_chapters: number;
  total_pages: number;
  total_words: number;
  total_images: number;
  generation_time: number;
  created_at: string;
}

interface BookData {
  book_metadata: BookMetadata;
  table_of_contents: Array<{
    chapter_number: string;
    title: string;
    page: string;
  }>;
  chapters: BookChapter[];
  bibliography?: string[];
  cover_design_info?: any;
}

export class PDFGenerator {
  private pdf: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number;
  private currentY: number;
  private pageNumber: number;
  private lineHeight: number;
  private fontSize: number;

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = 297; // A4 height in mm
    this.pageWidth = 210; // A4 width in mm
    this.margin = 20;
    this.currentY = this.margin;
    this.pageNumber = 1;
    this.lineHeight = 6;
    this.fontSize = 11;
    
    // Set default font
    this.pdf.setFont('times', 'normal');
    this.pdf.setFontSize(this.fontSize);
  }

  private addPage() {
    this.pdf.addPage();
    this.currentY = this.margin;
    this.pageNumber++;
  }

  private checkPageBreak(requiredHeight: number = 10) {
    if (this.currentY + requiredHeight > this.pageHeight - this.margin) {
      this.addPage();
    }
  }

  private addText(text: string, options: {
    fontSize?: number;
    fontStyle?: 'normal' | 'bold' | 'italic';
    align?: 'left' | 'center' | 'right';
    maxWidth?: number;
    lineHeight?: number;
  } = {}) {
    const fontSize = options.fontSize || this.fontSize;
    const fontStyle = options.fontStyle || 'normal';
    const align = options.align || 'left';
    const maxWidth = options.maxWidth || (this.pageWidth - 2 * this.margin);
    const lineHeight = options.lineHeight || this.lineHeight;

    this.pdf.setFontSize(fontSize);
    this.pdf.setFont('times', fontStyle);

    const lines = this.pdf.splitTextToSize(text, maxWidth);
    const totalHeight = lines.length * lineHeight;

    this.checkPageBreak(totalHeight);

    let x = this.margin;
    if (align === 'center') {
      x = this.pageWidth / 2;
    } else if (align === 'right') {
      x = this.pageWidth - this.margin;
    }

    for (let i = 0; i < lines.length; i++) {
      this.pdf.text(lines[i], x, this.currentY, { align: align as any });
      this.currentY += lineHeight;
    }

    this.currentY += 2; // Extra spacing after text block
  }

  private addImage(imageData: string, caption?: string) {
    try {
      // Remove data:image/jpeg;base64, prefix if present
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const imgWidth = 160; // Image width in mm
      const imgHeight = 120; // Image height in mm
      
      this.checkPageBreak(imgHeight + 20);

      // Center the image
      const x = (this.pageWidth - imgWidth) / 2;
      
      this.pdf.addImage(base64Data, 'JPEG', x, this.currentY, imgWidth, imgHeight);
      this.currentY += imgHeight + 5;

      if (caption) {
        this.addText(caption, {
          fontSize: 10,
          fontStyle: 'italic',
          align: 'center',
          lineHeight: 4
        });
      }

      this.currentY += 5;
    } catch (error) {
      console.error('Error adding image to PDF:', error);
      // Continue without the image
      if (caption) {
        this.addText(`[Image: ${caption}]`, {
          fontSize: 10,
          fontStyle: 'italic',
          align: 'center'
        });
      }
    }
  }

  private addFooter() {
    const footerY = this.pageHeight - 10;
    this.pdf.setFontSize(9);
    this.pdf.setFont('times', 'normal');
    this.pdf.text(
      `Page ${this.pageNumber}`,
      this.pageWidth / 2,
      footerY,
      { align: 'center' }
    );
  }

  private addCoverPage(metadata: BookMetadata) {
    // Title
    this.addText(metadata.title, {
      fontSize: 24,
      fontStyle: 'bold',
      align: 'center',
      lineHeight: 12
    });

    this.currentY += 20;

    // Author
    this.addText(`by ${metadata.author}`, {
      fontSize: 16,
      align: 'center',
      lineHeight: 8
    });

    this.currentY += 40;

    // Book info
    const bookInfo = [
      `Genre: ${metadata.genre}`,
      `Chapters: ${metadata.total_chapters}`,
      `Words: ${metadata.total_words.toLocaleString()}`,
      `Generated: ${new Date(metadata.created_at).toLocaleDateString()}`
    ];

    bookInfo.forEach(info => {
      this.addText(info, {
        fontSize: 12,
        align: 'center',
        lineHeight: 6
      });
    });

    // Add decorative line
    this.currentY += 20;
    const lineY = this.currentY;
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin + 30, lineY, this.pageWidth - this.margin - 30, lineY);
    this.currentY += 10;

    this.addText('Generated with AI Technology', {
      fontSize: 10,
      align: 'center',
      fontStyle: 'italic'
    });

    this.addPage();
  }

  private addTableOfContents(toc: Array<{ chapter_number: string; title: string; page: string }>) {
    this.addText('Table of Contents', {
      fontSize: 18,
      fontStyle: 'bold',
      align: 'center',
      lineHeight: 10
    });

    this.currentY += 10;

    toc.forEach(item => {
      this.checkPageBreak();
      
      const dotLine = '.'.repeat(50);
      const chapterText = `Chapter ${item.chapter_number}: ${item.title}`;
      const pageText = `${item.page}`;
      
      // Chapter title
      this.pdf.setFont('times', 'normal');
      this.pdf.setFontSize(11);
      this.pdf.text(chapterText, this.margin, this.currentY);
      
      // Page number
      this.pdf.text(pageText, this.pageWidth - this.margin, this.currentY, { align: 'right' });
      
      this.currentY += this.lineHeight;
    });

    this.addPage();
  }

  private addChapter(chapter: BookChapter, isFirstChapter: boolean = false) {
    if (!isFirstChapter) {
      this.addPage();
    }

    // Chapter title
    this.addText(`Chapter ${chapter.chapter_number}`, {
      fontSize: 16,
      fontStyle: 'bold',
      lineHeight: 8
    });

    this.addText(chapter.title, {
      fontSize: 14,
      fontStyle: 'bold',
      lineHeight: 8
    });

    this.currentY += 5;

    // Chapter content
    const sections = chapter.content.split('\n');
    let imageIndex = 0;

    sections.forEach(section => {
      const trimmedSection = section.trim();
      
      if (!trimmedSection) {
        this.currentY += 3;
        return;
      }

      if (trimmedSection.startsWith('##')) {
        // Section heading
        this.currentY += 5;
        this.addText(trimmedSection.replace('##', '').trim(), {
          fontSize: 13,
          fontStyle: 'bold',
          lineHeight: 7
        });
      } else if (trimmedSection.includes('[IMAGE_SUGGESTION:')) {
        // Skip image suggestions in text
        return;
      } else {
        // Regular paragraph
        this.addText(trimmedSection, {
          fontSize: 11,
          lineHeight: 6
        });
        
        // Add image after paragraph if available
        if (imageIndex < chapter.images.length && Math.random() > 0.7) {
          const image = chapter.images[imageIndex];
          this.addImage(image.data, image.caption);
          imageIndex++;
        }
      }
    });

    // Add remaining images at the end of chapter
    while (imageIndex < chapter.images.length) {
      const image = chapter.images[imageIndex];
      this.addImage(image.data, image.caption);
      imageIndex++;
    }

    // Chapter stats
    this.currentY += 10;
    this.addText(`Chapter Summary: ${chapter.word_count} words, ${chapter.images.length} images`, {
      fontSize: 9,
      fontStyle: 'italic',
      align: 'right'
    });
  }

  private addBibliography(bibliography: string[]) {
    this.addPage();
    
    this.addText('Bibliography', {
      fontSize: 16,
      fontStyle: 'bold',
      align: 'center',
      lineHeight: 10
    });

    this.currentY += 5;

    bibliography.forEach((entry, index) => {
      this.checkPageBreak();
      this.addText(`${index + 1}. ${entry}`, {
        fontSize: 10,
        lineHeight: 5
      });
    });
  }

  public async generatePDF(bookData: BookData): Promise<Blob> {
    try {
      // Add cover page
      this.addCoverPage(bookData.book_metadata);
      
      // Add table of contents
      if (bookData.table_of_contents && bookData.table_of_contents.length > 0) {
        this.addTableOfContents(bookData.table_of_contents);
      }

      // Add chapters
      bookData.chapters.forEach((chapter, index) => {
        this.addChapter(chapter, index === 0);
        
        // Add footer to each page
        this.addFooter();
      });

      // Add bibliography
      if (bookData.bibliography && bookData.bibliography.length > 0) {
        this.addBibliography(bookData.bibliography);
        this.addFooter();
      }

      // Generate PDF blob
      const pdfBlob = this.pdf.output('blob');
      return pdfBlob;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  public downloadPDF(bookData: BookData, filename?: string) {
    this.generatePDF(bookData).then(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `${bookData.book_metadata.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }).catch(error => {
      console.error('Failed to download PDF:', error);
    });
  }

  public async getPDFBase64(bookData: BookData): Promise<string> {
    const blob = await this.generatePDF(bookData);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data:application/pdf;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const pdfGenerator = new PDFGenerator();
