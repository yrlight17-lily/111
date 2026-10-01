import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  WidthType,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
} from 'docx';
import { AnalysisProject, ReportDraft } from '../types';

export async function exportReportToDocx(project: AnalysisProject, report: ReportDraft): Promise<void> {
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: report.title || project.title,
          bold: true,
          size: 36, // 18pt
          color: '1E3A8A', // Deep navy
        }),
      ],
    })
  );

  // Subtitle
  if (report.subtitle) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: report.subtitle,
            italics: true,
            size: 24, // 12pt
            color: '475569',
          }),
        ],
      })
    );
  }

  // Meta Table
  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: '과정명', bold: true })] })],
          }),
          new TableCell({
            width: { size: 75, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ text: project.title })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '요청부서 / 대상', bold: true })] })],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: `${project.requestDepartment || 'HRD'} / ${project.targetRole} (${project.targetLevel}, ${project.targetCount}명)`,
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '분석 일정', bold: true })] })],
          }),
          new TableCell({
            children: [new Paragraph({ text: `${project.startDate} ~ ${project.endDate}` })],
          }),
        ],
      }),
    ],
  });
  children.push(metaTable);
  children.push(new Paragraph({ spacing: { after: 300 } }));

  // Executive Summary Box
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: 'Executive Summary (핵심 요약)',
          bold: true,
          color: '0F172A',
        }),
      ],
      spacing: { before: 200, after: 120 },
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: report.executiveSummary,
          size: 22,
          color: '334155',
        }),
      ],
    })
  );

  // Sections
  report.sections.forEach((sec) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: sec.title,
            bold: true,
            size: 28,
            color: '1E3A8A',
          }),
        ],
        spacing: { before: 360, after: 140 },
      })
    );

    // Split paragraphs from markdown content
    const lines = sec.content.split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        children.push(new Paragraph({ spacing: { after: 100 } }));
        return;
      }

      if (trimmed.startsWith('### ')) {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [
              new TextRun({
                text: trimmed.replace('### ', ''),
                bold: true,
                size: 24,
                color: '1E293B',
              }),
            ],
            spacing: { before: 180, after: 80 },
          })
        );
      } else if (trimmed.startsWith('#### ')) {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_4,
            children: [
              new TextRun({
                text: trimmed.replace('#### ', ''),
                bold: true,
                size: 22,
                color: '334155',
              }),
            ],
            spacing: { before: 140, after: 60 },
          })
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: trimmed.replace(/^[-*]\s+/, ''),
                size: 21,
              }),
            ],
            spacing: { after: 60 },
          })
        );
      } else if (trimmed.startsWith('>')) {
        children.push(
          new Paragraph({
            indent: { left: convertInchesToTwip(0.4) },
            children: [
              new TextRun({
                text: trimmed.replace(/^>\s*/, ''),
                italics: true,
                color: '475569',
                size: 21,
              }),
            ],
            spacing: { before: 60, after: 80 },
          })
        );
      } else {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmed,
                size: 21,
                color: '1E293B',
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
    });

    // Key Takeaways if any
    if (sec.keyTakeaways && sec.keyTakeaways.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '※ 핵심 시사점:',
              bold: true,
              color: '2563EB',
              size: 20,
            }),
          ],
          spacing: { before: 120, after: 40 },
        })
      );
      sec.keyTakeaways.forEach((k) => {
        children.push(
          new Paragraph({
            bullet: { level: 1 },
            children: [
              new TextRun({
                text: k,
                size: 20,
                color: '1E3A8A',
              }),
            ],
            spacing: { after: 40 },
          })
        );
      });
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `${project.title.replace(/[\\/:*?"<>|]/g, '_')}_요구분석결과서.docx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
