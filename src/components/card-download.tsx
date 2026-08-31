"use client";

export function CardDownload({ svg, memberId, label, alt }: { svg: string; memberId: string; label: string; alt: string }) {
  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  async function downloadPng() {
    const image = new Image();
    image.decoding = "async";
    image.src = svgDataUrl;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || 1050;
    canvas.height = image.naturalHeight || 660;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.drawImage(image, 0, 0);
    const link = document.createElement("a");
    link.download = `${memberId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="grid gap-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="w-full rounded-lg border border-slate-200 bg-white shadow-soft" src={svgDataUrl} alt={alt} />
      <button className="min-h-12 rounded-md bg-hub-green px-5 py-3 font-bold text-white" type="button" onClick={downloadPng}>
        {label}
      </button>
    </div>
  );
}
