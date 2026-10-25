'use strict';
const film = document.getElementById('film');
const replay = document.getElementById('replay');
const status = document.getElementById('playback-status');
film.addEventListener('play', () => { status.textContent = '正在进入内部。'; });
film.addEventListener('pause', () => {
  if (!film.ended) status.textContent = '已暂停。继续播放，或从头再看一次。';
});
film.addEventListener('ended', () => { status.textContent = '已播放完毕。'; });
film.addEventListener('error', () => { status.textContent = '视频暂时无法播放，请使用「下载 MP4」保存后观看。'; });
replay.addEventListener('click', async () => {
  film.currentTime = 0;
  try { await film.play(); }
  catch (error) {
    if (error.name !== 'AbortError') status.textContent = '请使用视频上的播放控件开始观看。';
  }
});
