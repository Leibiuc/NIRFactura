# NIRFactura

Upload a supplier invoice (PDF or image) and get a filled NIR Excel file in seconds.

## What it does

1. **Upload** a supplier invoice (PDF or image)
2. **Review** the extracted line items — edit names, quantities, prices, VAT rates, and markup before proceeding
3. **Download** a ready-to-use NIR `.xlsx` file

Invoice data is extracted using Claude (Anthropic) via vision OCR.

## Stack

- [Next.js 16](https://nextjs.org) — app router, API routes
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) — invoice OCR via Claude vision
- [ExcelJS](https://github.com/exceljs/exceljs) — NIR Excel generation
- [Zod](https://zod.dev) — runtime schema validation
- [Tailwind CSS 4](https://tailwindcss.com) — styling

## Getting started

```bash
npm install
```

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for invoice OCR |

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # production server
npm run lint     # ESLint
npm run test     # Jest
```
