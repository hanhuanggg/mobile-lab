'use strict';
// Minimal state machine: copy this folder, then replace the premise and feedback.
const title = document.querySelector('#title');
const message = document.querySelector('#message');
const trigger = document.querySelector('#trigger');
const reset = document.querySelector('#reset');
const beats = [
  ['你按了。', '现在我说「再按一次」。你还觉得这是反抗吗？', '再按一次'],
  ['很听话。', '从第二次开始，你就在执行按钮的命令。', '那我不按了'],
  ['还是按了。', '连「不按」都替你做成了按钮。最后一次：把决定拿回去。', '结束这个实验'],
];
let step = 0;
trigger.addEventListener('click', () => {
  if (step < beats.length) {
    const [heading, text, label] = beats[step++];
    title.textContent = heading;
    message.textContent = text;
    trigger.textContent = label;
    return;
  }
  title.textContent = '你可以离开。';
  message.textContent = '这一次没有下一条指令。屏幕外的世界，不需要按钮批准。';
  document.body.classList.add('finished');
  trigger.hidden = true;
  reset.hidden = false;
  reset.focus();
});
reset.addEventListener('click', () => {
  step = 0;
  document.body.classList.remove('finished');
  title.innerHTML = '请勿<br>按下。';
  message.textContent = '这是一颗不希望被使用的按钮。';
  trigger.textContent = '我偏要';
  trigger.hidden = false;
  reset.hidden = true;
  trigger.focus();
});
