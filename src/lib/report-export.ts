import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import ExcelJS from "exceljs";
import type { ReportDetail } from "./report-queries";
import { SECTION_LABELS, type SectionKey } from "./reports";
import { monthName } from "./dates";

export type ReportExportActivity = {
  date: string;
  title: string;
  category: string;
  target: string;
  output: string;
  quantity: string;
  status: string;
};

export type ReportExportModel = {
  title: string;
  period: string;
  status: string;
  submitted: string | null;
  reviewed: string | null;
  owner: { nama: string; nip: string; jabatan: string; unit: string };
  sections: { label: string; content: string }[];
  activities: ReportExportActivity[];
  reviews: { date: string; reviewer: string; decision: string; comment: string }[];
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Menunggu review",
  revision: "Perlu revisi",
  approved: "Disetujui",
};

const DECISION_LABELS: Record<string, string> = {
  approved: "Disetujui",
  revision: "Perlu revisi",
  comment: "Komentar",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dateOnly(value: Date) {
  return `${pad(value.getUTCDate())}/${pad(value.getUTCMonth() + 1)}/${value.getUTCFullYear()}`;
}

function dateTime(value: Date) {
  return `${dateOnly(value)} ${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}`;
}

export function buildExportModel(report: ReportDetail): ReportExportModel {
  const status = STATUS_LABELS[report.status] ?? report.status;
  const activities = report.report_activities
    .map((ra) => ra.activities)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((a) => ({
      date: dateOnly(a.date),
      title: a.title,
      category: a.categories?.name ?? "-",
      target: a.targets?.name ?? "-",
      output: a.output ?? "-",
      quantity: a.quantity === null ? "-" : `${Number(a.quantity)}${a.unit ? ` ${a.unit}` : ""}`,
      status: a.status,
    }));

  return {
    title: `Laporan Kinerja Bulanan ${monthName(report.period_month)} ${report.period_year}`,
    period: `${monthName(report.period_month)} ${report.period_year}`,
    status,
    submitted: report.submitted_at ? dateTime(report.submitted_at) : null,
    reviewed: report.reviewed_at ? dateTime(report.reviewed_at) : null,
    owner: {
      nama: report.users.nama,
      nip: report.users.nip,
      jabatan: report.users.jabatan ?? "-",
      unit: report.users.units?.name ?? "-",
    },
    sections: report.report_sections
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => ({
        label: SECTION_LABELS[s.section_key as SectionKey] ?? s.section_key,
        content: s.content ?? "-",
      })),
    activities,
    reviews: report.report_reviews.map((r) => ({
      date: dateTime(r.created_at),
      reviewer: r.users.nama,
      decision: DECISION_LABELS[r.decision] ?? r.decision,
      comment: r.comment ?? "-",
    })),
  };
}

function metaLines(model: ReportExportModel) {
  return [
    `Pegawai: ${model.owner.nama} (${model.owner.nip})`,
    `Jabatan: ${model.owner.jabatan}`,
    `Unit: ${model.owner.unit}`,
    `Periode: ${model.period}`,
    `Status: ${model.status}`,
    model.submitted ? `Disubmit: ${model.submitted}` : "",
    model.reviewed ? `Ditinjau: ${model.reviewed}` : "",
  ].filter(Boolean);
}

/* ------------------------------ PDF ------------------------------ */

function pdfSafe(text: string) {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00b7/g, "-")
    .replace(/[^\t\n\r\x20-\x7e]/g, "?");
}

export async function buildReportPdf(model: ReportExportModel): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const newPage = () => {
    page = doc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const ensure = (height: number) => {
    if (y - height < margin) newPage();
  };

  const wrap = (text: string, size: number, useBold: boolean, width: number) => {
    const font = useBold ? bold : regular;
    const lines: string[] = [];
    for (const rawLine of pdfSafe(text).split(/\r?\n/)) {
      const words = rawLine.split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        lines.push("");
        continue;
      }
      let line = "";
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) > width && line) {
          lines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      }
      if (line) lines.push(line);
    }
    return lines;
  };

  const write = (
    text: string,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number; indent?: number } = {},
  ) => {
    const size = opts.size ?? 10;
    const useBold = opts.bold ?? false;
    const font = useBold ? bold : regular;
    const lineHeight = size * 1.45;
    const indent = opts.indent ?? 0;
    const lines = wrap(text, size, useBold, contentWidth - indent);
    for (const line of lines) {
      ensure(lineHeight);
      page.drawText(line, {
        x: margin + indent,
        y: y - size,
        size,
        font,
        color: opts.color ? rgb(...opts.color) : rgb(0.12, 0.15, 0.2),
      });
      y -= lineHeight;
    }
    y -= opts.gap ?? 4;
  };

  write(model.title, { size: 18, bold: true, gap: 8 });
  for (const line of metaLines(model)) write(line, { size: 9, color: [0.42, 0.45, 0.5], gap: 1 });
  y -= 8;

  for (const section of model.sections) {
    write(section.label.toUpperCase(), { size: 11, bold: true, color: [0.15, 0.39, 0.92], gap: 2 });
    write(section.content, { size: 10, gap: 10 });
  }

  write("DAFTAR AKTIVITAS", { size: 11, bold: true, color: [0.15, 0.39, 0.92], gap: 3 });
  if (model.activities.length === 0) {
    write("Tidak ada aktivitas pada periode ini.", { size: 10 });
  } else {
    for (const a of model.activities) {
      write(`${a.date}  ${a.title}`, { size: 10, bold: true, gap: 0 });
      write(`Kategori: ${a.category} | Target: ${a.target} | Output: ${a.output} | Jumlah: ${a.quantity} | Status: ${a.status}`, {
        size: 8.5,
        color: [0.42, 0.45, 0.5],
        gap: 6,
      });
    }
  }

  if (model.reviews.length) {
    write("RIWAYAT TINJAUAN", { size: 11, bold: true, color: [0.15, 0.39, 0.92], gap: 3 });
    for (const r of model.reviews) {
      write(`${r.date} - ${r.reviewer} - ${r.decision}`, { size: 9, bold: true, gap: 0 });
      write(r.comment, { size: 9, gap: 6 });
    }
  }

  const pages = doc.getPages();
  pages.forEach((p, index) => {
    p.drawText(`SKPFlow - ${model.period} - Halaman ${index + 1}/${pages.length}`, {
      x: margin,
      y: 28,
      size: 8,
      font: regular,
      color: rgb(0.6, 0.63, 0.67),
    });
  });

  return doc.save();
}

/* ------------------------------ DOCX ------------------------------ */

function docParagraph(text: string, opts: { bold?: boolean; size?: number; color?: string; spacingAfter?: number } = {}) {
  return new Paragraph({
    spacing: { after: opts.spacingAfter ?? 80 },
    children: [
      new TextRun({
        text,
        bold: opts.bold ?? false,
        size: opts.size ?? 22,
        color: opts.color ?? "1F2937",
        font: "Calibri",
      }),
    ],
  });
}

export async function buildReportDocx(model: ReportExportModel): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
      spacing: { after: 160 },
      children: [new TextRun({ text: model.title, bold: true, size: 36, color: "1D4ED8", font: "Calibri" })],
    }),
    ...metaLines(model).map((line) => docParagraph(line, { size: 19, color: "6B7280", spacingAfter: 40 })),
    new Paragraph({ text: "", spacing: { after: 120 } }),
  ];

  for (const section of model.sections) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 220, after: 80 },
        children: [new TextRun({ text: section.label, bold: true, size: 26, color: "1D4ED8", font: "Calibri" })],
      }),
    );
    for (const part of section.content.split(/\r?\n/)) {
      children.push(docParagraph(part || " ", { size: 21, spacingAfter: 60 }));
    }
  }

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 260, after: 80 },
      children: [new TextRun({ text: "Daftar Aktivitas", bold: true, size: 26, color: "1D4ED8", font: "Calibri" })],
    }),
  );

  if (model.activities.length === 0) {
    children.push(docParagraph("Tidak ada aktivitas pada periode ini.", { size: 20 }));
  } else {
    const header = ["Tanggal", "Kegiatan", "Kategori", "Target", "Output", "Jumlah", "Status"];
    const rows = model.activities.map(
      (a) =>
        new TableRow({
          children: [a.date, a.title, a.category, a.target, a.output, a.quantity, a.status].map(
            (value) =>
              new TableCell({
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                children: [new Paragraph({ children: [new TextRun({ text: value, size: 18, font: "Calibri" })] })],
              }),
          ),
        }),
    );
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: header.map(
              (value) =>
                new TableCell({
                  margins: { top: 60, bottom: 60, left: 80, right: 80 },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: value, bold: true, size: 18, color: "1D4ED8", font: "Calibri" })],
                    }),
                  ],
                }),
            ),
          }),
          ...rows,
        ],
      }),
    );
  }

  if (model.reviews.length) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 260, after: 80 },
        children: [new TextRun({ text: "Riwayat Tinjauan", bold: true, size: 26, color: "1D4ED8", font: "Calibri" })],
      }),
    );
    for (const r of model.reviews) {
      children.push(docParagraph(`${r.date} - ${r.reviewer} - ${r.decision}`, { bold: true, size: 19, spacingAfter: 30 }));
      children.push(docParagraph(r.comment, { size: 19, color: "4B5563", spacingAfter: 90 }));
    }
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBuffer(doc);
}

/* ------------------------------ XLSX ------------------------------ */

export async function buildReportXlsx(model: ReportExportModel): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SKPFlow";
  wb.created = new Date();

  const info = wb.addWorksheet("Laporan");
  info.columns = [
    { width: 26 },
    { width: 80 },
  ];
  const infoRows: [string, string][] = [
    ["Judul", model.title],
    ["Nama", model.owner.nama],
    ["NIP", model.owner.nip],
    ["Jabatan", model.owner.jabatan],
    ["Unit", model.owner.unit],
    ["Periode", model.period],
    ["Status", model.status],
    ["Disubmit", model.submitted ?? "-"],
    ["Ditinjau", model.reviewed ?? "-"],
  ];
  infoRows.forEach(([label, value]) => info.addRow([label, value]));
  info.getColumn(1).font = { bold: true };
  info.getColumn(2).alignment = { wrapText: true, vertical: "top" };

  const sections = wb.addWorksheet("Seksi");
  sections.columns = [
    { width: 6 },
    { width: 28 },
    { width: 100 },
  ];
  sections.addRow(["No", "Seksi", "Isi"]).font = { bold: true };
  model.sections.forEach((s, i) => sections.addRow([i + 1, s.label, s.content]));
  sections.getColumn(3).alignment = { wrapText: true, vertical: "top" };
  sections.getRow(1).font = { bold: true };
  sections.views = [{ state: "frozen", ySplit: 1 }];

  const activities = wb.addWorksheet("Aktivitas");
  activities.columns = [
    { width: 12 },
    { width: 46 },
    { width: 22 },
    { width: 26 },
    { width: 26 },
    { width: 12 },
    { width: 14 },
  ];
  activities.addRow(["Tanggal", "Kegiatan", "Kategori", "Target", "Output", "Jumlah", "Status"]).font = { bold: true };
  for (const a of model.activities) {
    activities.addRow([a.date, a.title, a.category, a.target, a.output, a.quantity, a.status]);
  }
  activities.getColumn(2).alignment = { wrapText: true, vertical: "top" };
  activities.getRow(1).font = { bold: true };
  activities.views = [{ state: "frozen", ySplit: 1 }];
  activities.autoFilter = { from: "A1", to: "G1" };

  const reviews = wb.addWorksheet("Tinjauan");
  reviews.columns = [
    { width: 18 },
    { width: 26 },
    { width: 18 },
    { width: 80 },
  ];
  reviews.addRow(["Tanggal", "Peninjau", "Keputusan", "Komentar"]).font = { bold: true };
  for (const r of model.reviews) reviews.addRow([r.date, r.reviewer, r.decision, r.comment]);
  reviews.getColumn(4).alignment = { wrapText: true, vertical: "top" };
  reviews.getRow(1).font = { bold: true };
  reviews.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
