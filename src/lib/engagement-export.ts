import {
  Document,
  Paragraph,
  TextRun,
  WidthType,
  AlignmentType,
  Packer,
} from "docx";
import { saveAs } from "file-saver";

export interface EngagementData {
  engagement_number?: string;
  client_name?: string;
  client_company?: string;
  client_address?: string;
  client_email?: string;
  assignment_description?: string;
  scope?: string;
  deliverables?: string;
  timeline?: string;
  fee_description?: string;
  fee_amount?: number;
  conditions?: string;
  project_name?: string;
  project_address?: string;
}

export interface SenderInfo {
  full_name?: string;
  company?: string;
  email?: string;
  phone?: string;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK" }).format(n);

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 100 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 24 })],
  });
}

function bodyText(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 20 })],
  });
}

function multiLineText(text: string): Paragraph[] {
  return text.split("\n").filter(Boolean).map((line) => bodyText(line));
}

export async function exportEngagementToWord(data: EngagementData, sender: SenderInfo) {
  const children: Paragraph[] = [];

  // Sender
  if (sender.company) children.push(new Paragraph({ children: [new TextRun({ text: sender.company, bold: true, font: "Arial", size: 28 })] }));
  if (sender.full_name) children.push(bodyText(sender.full_name));
  if (sender.phone) children.push(bodyText(`Tlf: ${sender.phone}`));
  if (sender.email) children.push(bodyText(sender.email));
  children.push(new Paragraph({ spacing: { after: 300 }, children: [] }));

  // Title
  children.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: `Oppdragsbekreftelse${data.engagement_number ? ` – ${data.engagement_number}` : ""}`, bold: true, font: "Arial", size: 36 })],
  }));

  // Date
  children.push(bodyText(`Dato: ${new Date().toLocaleDateString("nb-NO")}`));
  children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  // Client
  if (data.client_company || data.client_name) {
    children.push(sectionTitle("Oppdragsgiver"));
    if (data.client_company) children.push(bodyText(data.client_company));
    if (data.client_name) children.push(bodyText(`v/ ${data.client_name}`));
    if (data.client_address) children.push(bodyText(data.client_address));
    if (data.client_email) children.push(bodyText(data.client_email));
  }

  // Project
  if (data.project_name) {
    children.push(sectionTitle("Prosjekt"));
    children.push(bodyText(data.project_name));
    if (data.project_address) children.push(bodyText(data.project_address));
  }

  // Assignment description
  if (data.assignment_description) {
    children.push(sectionTitle("Oppdragsbeskrivelse"));
    children.push(...multiLineText(data.assignment_description));
  }

  // Scope
  if (data.scope) {
    children.push(sectionTitle("Omfang"));
    children.push(...multiLineText(data.scope));
  }

  // Deliverables
  if (data.deliverables) {
    children.push(sectionTitle("Leveranser"));
    children.push(...multiLineText(data.deliverables));
  }

  // Timeline
  if (data.timeline) {
    children.push(sectionTitle("Tidsplan"));
    children.push(...multiLineText(data.timeline));
  }

  // Fee
  if (data.fee_description || data.fee_amount) {
    children.push(sectionTitle("Honorar"));
    if (data.fee_description) children.push(...multiLineText(data.fee_description));
    if (data.fee_amount) children.push(bodyText(`Totalt honorar: ${formatCurrency(data.fee_amount)}`));
  }

  // Conditions
  if (data.conditions) {
    children.push(sectionTitle("Vilkår"));
    children.push(...multiLineText(data.conditions));
  }

  // Signature area
  children.push(new Paragraph({ spacing: { before: 600 }, children: [] }));
  children.push(new Paragraph({
    spacing: { after: 600 },
    children: [new TextRun({ text: "___________________________                    ___________________________", font: "Arial", size: 20 })],
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: `${sender.full_name || "Rådgiver"}                                              ${data.client_name || "Oppdragsgiver"}`, font: "Arial", size: 18 })],
  }));

  const doc = new Document({
    sections: [{
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Oppdragsbekreftelse${data.engagement_number ? `_${data.engagement_number}` : ""}.docx`);
}
