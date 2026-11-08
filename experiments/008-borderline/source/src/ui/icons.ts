const paths:Record<string,string>={
  fullscreen:'<path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/>',
  shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9S4 17 4 12V6z"/><path d="m8 12 3 3 5-6"/>',
  bolt:'<path d="m13 2-9 12h7l-1 8 10-13h-7z"/>',
  crosshair:'<circle cx="12" cy="12" r="7"/><path d="M12 1v6m0 10v6M1 12h6m10 0h6"/>',
  pause:'<path d="M8 5v14M16 5v14" stroke-width="4"/>',
  play:'<path d="m8 4 12 8-12 8z"/>',
  sound:'<path d="M4 9v6h4l5 4V5L8 9zM17 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/>',
  mute:'<path d="M4 9v6h4l5 4V5L8 9zM17 9l5 6m0-6-5 6"/>',
  close:'<path d="m5 5 14 14M5 19 19 5"/>',
  arrow:'<path d="M3 12h17m-7-7 7 7-7 7"/>',
  back:'<path d="M21 12H4m7-7-7 7 7 7"/>',
  restart:'<path d="M4 10a8 8 0 1 1 2 8M4 3v7h7"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 3c-1 1-1 2-1 3m0 2v1"/>',
  chevron:'<path d="m7 4 8 8-8 8"/>',
  medical:'<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
  flag:'<path d="M5 22V3h14l-3 4 3 4H5"/>',
};
export const icon=(name:string)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${paths[name]||paths.crosshair}</svg>`;
