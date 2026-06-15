"use client";

export function EdtExpandControls() {
  function setAll(open: boolean) {
    document.querySelectorAll<HTMLDetailsElement>("[data-edt-detail]").forEach((detail) => {
      detail.open = open;
    });
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button type="button" onClick={() => setAll(true)} className="rounded-xl bg-[#062553] px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-[#083b80]">
        Expandir tudo
      </button>
      <button type="button" onClick={() => setAll(false)} className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-black text-[#062553] shadow-sm hover:bg-blue-50">
        Recolher tudo
      </button>
    </div>
  );
}
