import { Injectable } from "@angular/core";
import jsPDF from "jspdf";

export interface MedicineRecommendation {
  suggestedMedications: string;
  frequencyRecommendations: string;
  warnings: string;
  interactions: string;
}

export interface PatientInfo {
  fullName: string;
  age?: number;
  gender?: string;
  hospitalNo?: string;
}

@Injectable({
  providedIn: "root",
})
export class PdfService {
  constructor() {}

  /**
   * Parses medicine recommendations text into structured data
   */
  private parseMedicineRecommendations(
    medicineText: string
  ): Array<{ name: string; quantity: string }> {
    console.log("PDF Service: Parsing medicine recommendations");
    console.log("Input text:", medicineText);

    const medicines: Array<{ name: string; quantity: string }> = [];

    if (!medicineText) {
      console.log("No medicine text provided");
      return medicines;
    }

    // Split by medicine blocks (each starts with **Medicine:**)
    const medicineBlocks = medicineText
      .split(/\*\*Medicine:\*\*/)
      .filter((block) => block.trim());

    console.log("Medicine blocks found:", medicineBlocks.length);

    medicineBlocks.forEach((block, index) => {
      console.log(`Processing block ${index + 1}:`, block);
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);

      let name = "";
      let quantity = "";

      lines.forEach((line) => {
        if (line.startsWith("**Quantity:**")) {
          quantity = line.replace("**Quantity:**", "").trim();
          console.log("Found quantity:", quantity);
        } else if (
          !line.startsWith("**Reason:**") &&
          !line.startsWith("**Reference:**") &&
          line.length > 0
        ) {
          // The first non-empty line that's not a special field is likely the medicine name
          if (!name) {
            name = line;
            console.log("Found medicine name:", name);
          }
        }
      });

      if (name && quantity) {
        medicines.push({ name, quantity });
        console.log("Added medicine:", { name, quantity });
      } else {
        console.log("Skipped medicine - missing name or quantity:", {
          name,
          quantity,
        });
      }
    });

    console.log("Final parsed medicines:", medicines);
    return medicines;
  }

  /**
   * Generates a PDF for medicine recommendations
   * @param recommendations - The medicine recommendations data
   * @param patientInfo - Patient information
   * @param doctorName - Doctor's name
   * @param date - Date of prescription
   */
  generateMedicineRecommendationsPDF(
    recommendations: MedicineRecommendation,
    patientInfo: PatientInfo,
    doctorName: string = "Dr. Smith",
    date: Date = new Date()
  ): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    // Helper function to add text with word wrapping
    const addWrappedText = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      fontSize: number = 10
    ) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + lines.length * (fontSize * 0.4) + 5;
    };

    // Helper function to create a table
    const createTable = (
      headers: string[],
      data: Array<{ name: string; quantity: string }>,
      startY: number
    ): number => {
      const tableWidth = pageWidth - 2 * margin;
      const colWidth = tableWidth / headers.length;
      const rowHeight = 15;

      // Draw table headers with simple border
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);

      headers.forEach((header, index) => {
        const x = margin + index * colWidth;
        doc.rect(x, startY, colWidth, rowHeight, "S"); // Simple border only
        doc.text(header, x + 5, startY + 10);
      });

      // Draw table data with simple styling
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      data.forEach((row, rowIndex) => {
        const y = startY + (rowIndex + 1) * rowHeight;

        // Draw medicine name cell
        doc.rect(margin, y, colWidth, rowHeight, "S"); // Simple border only
        const nameLines = doc.splitTextToSize(row.name, colWidth - 10);
        doc.text(nameLines, margin + 5, y + 10);

        // Draw quantity cell
        doc.rect(margin + colWidth, y, colWidth, rowHeight, "S"); // Simple border only
        const quantityLines = doc.splitTextToSize(row.quantity, colWidth - 10);
        doc.text(quantityLines, margin + colWidth + 5, y + 10);
      });

      return startY + (data.length + 1) * rowHeight + 15;
    };

    // Helper function to add a section
    const addSection = (
      title: string,
      content: string,
      icon: string = ""
    ): number => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = margin;
      }

      // Section title
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      yPosition = addWrappedText(
        `${icon} ${title}`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
        12
      );

      // Section content
      doc.setFont("helvetica", "normal");
      yPosition = addWrappedText(
        content,
        margin + 10,
        yPosition,
        pageWidth - 2 * margin - 10,
        10
      );
      yPosition += 10;

      return yPosition;
    };

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("GlucoPlanner Recommendations", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 20;

    // Patient Information
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Information:", margin, yPosition);
    yPosition += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Name: ${patientInfo.fullName}`, margin, yPosition);
    yPosition += 6;

    if (patientInfo.age) {
      doc.text(`Age: ${patientInfo.age} years`, margin, yPosition);
      yPosition += 6;
    }

    if (patientInfo.gender) {
      doc.text(`Gender: ${patientInfo.gender}`, margin, yPosition);
      yPosition += 6;
    }

    if (patientInfo.hospitalNo) {
      doc.text(`Hospital No: ${patientInfo.hospitalNo}`, margin, yPosition);
      yPosition += 6;
    }

    doc.text(`Date: ${date.toLocaleDateString()}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Prescribed by: ${doctorName}`, margin, yPosition);
    yPosition += 15;

    // Add a line separator
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Medicine Recommendations Table
    if (recommendations.suggestedMedications) {
      // Parse medicine recommendations into structured data
      const medicines = this.parseMedicineRecommendations(
        recommendations.suggestedMedications
      );

      if (medicines.length > 0) {
        // Add section title
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Medicine Recommendations", margin, yPosition);
        yPosition += 20;

        // Create table
        const headers = ["Medicine Name", "Quantity"];
        yPosition = createTable(headers, medicines, yPosition);
      }
    }

    // Lifestyle Recommendations
    if (recommendations.frequencyRecommendations) {
      // Format lifestyle recommendations with bullet points
      const lifestyleText = recommendations.frequencyRecommendations
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => `• ${line.trim()}`)
        .join("\n");

      yPosition = addSection("Lifestyle Recommendations", lifestyleText, "");
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      "This document was generated by GlucoPlanner AI System",
      pageWidth / 2,
      footerY,
      { align: "center" }
    );
    doc.text(
      `Generated on: ${new Date().toLocaleString()}`,
      pageWidth / 2,
      footerY + 8,
      { align: "center" }
    );

    // Generate filename
    const filename = `medicine-recommendations-${patientInfo.fullName
      .replace(/\s+/g, "-")
      .toLowerCase()}-${date.toISOString().split("T")[0]}.pdf`;

    // Save the PDF
    doc.save(filename);
  }
}
