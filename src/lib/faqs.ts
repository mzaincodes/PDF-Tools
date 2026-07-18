import type { ToolFaq } from "@/types";

export const GENERAL_FAQS: ToolFaq[] = [
  {
    question: "Are my files uploaded to a server?",
    answer:
      "No. PDFpro processes everything locally in your browser using WebAssembly and modern browser APIs. Your files are loaded into memory, worked on, and then offered for download — they never leave your device or touch our servers.",
  },
  {
    question: "Is PDFpro really free?",
    answer:
      "Yes. Because all the heavy lifting happens on your own device, we don't pay for expensive processing servers — so every core tool is free to use with no watermarks, no daily limits and no account required.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "Nothing at all. PDFpro runs in any modern browser on Windows, macOS, Linux, Android and iOS. There's no app to download and no plugin to install.",
  },
  {
    question: "What file size can I work with?",
    answer:
      "Since processing runs on your machine, the practical limit is your device's available memory rather than an arbitrary server cap. Most tools comfortably handle documents of hundreds of pages.",
  },
  {
    question: "Which browsers are supported?",
    answer:
      "PDFpro works best in the latest versions of Chrome, Edge, Firefox, Safari, Brave and other Chromium-based browsers. For the fastest experience we recommend keeping your browser up to date.",
  },
  {
    question: "Can I use PDFpro for confidential documents?",
    answer:
      "Absolutely — that's exactly what it's built for. Because your documents are never transmitted anywhere, PDFpro is well suited to legal, medical, financial and other sensitive material.",
  },
  {
    question: "How is OCR able to run in the browser?",
    answer:
      "Our OCR uses Tesseract compiled to WebAssembly. The recognition model is downloaded to your browser on first use and cached, then all text recognition happens locally on your device.",
  },
  {
    question: "Will you keep adding new tools?",
    answer:
      "Yes. PDFpro is actively developed and we regularly ship new tools and improvements. If there's something you'd love to see, let us know via the contact page.",
  },
];
